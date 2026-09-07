import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { prisma } from "@investri/database";
import {
  CashFlowType,
  InvestmentOrderStatus,
  QuoteRejectedError,
  moneyString,
  quoteInvestment,
} from "@investri/domain";
import type { ProviderRegistry } from "@investri/providers";
import type {
  InvestmentQuoteInput,
  InvestmentSubmitInput,
  PlaidExchangeInput,
} from "@investri/validation";
import { randomUUID } from "node:crypto";
import type { RequestUser } from "../common/current-user";
import { PROVIDERS } from "../providers/providers.token";
import { OnboardingService } from "../onboarding/onboarding.service";
import { TaxCreditEngineService } from "../tax-credits/tax-credit-engine.service";
import { NotificationType, NotificationsService } from "../notifications/notifications.service";
import { AnalyticsEvent, noopAnalytics } from "@investri/analytics";

const CREDIT_PENDING = "pending_commerce_certification";

@Injectable()
export class InvestmentsService {
  constructor(
    @Inject(PROVIDERS) private readonly providers: ProviderRegistry,
    private readonly onboarding: OnboardingService,
    private readonly taxCredits?: TaxCreditEngineService,
    private readonly notifications?: NotificationsService,
  ) {}

  async quote(user: RequestUser, input: InvestmentQuoteInput) {
    await this.assertEligible(user);
    const offering = await this.loadOffering(input.offeringId);
    try {
      const quote = quoteInvestment({
        amount: input.amount,
        minInvestment: moneyString(offering.minInvestment),
        maxInvestment: offering.maxInvestment ? moneyString(offering.maxInvestment) : null,
        creditRate: offering.taxCreditProgram ? moneyString(offering.taxCreditProgram.creditRate) : "0",
      });
      const limit = await this.providers.eligibility.calculateInvestmentLimit({
        userId: user.id,
        offeringId: offering.id,
        requestedAmount: quote.amount,
      });
      if (!limit.permitted) {
        throw new UnprocessableEntityException({
          code: "LIMIT_FAILED",
          message: limit.reason ?? "Amount exceeds the permitted limit",
          maximumAmount: limit.maximumAmount,
        });
      }
      return {
        ...quote,
        offeringId: offering.id,
        offeringName: offering.name,
        programStatus: offering.taxCreditProgram?.status ?? null,
        creditPendingLabel: CREDIT_PENDING,
      };
    } catch (error) {
      if (error instanceof QuoteRejectedError) {
        throw new UnprocessableEntityException({ code: error.code, message: error.message });
      }
      throw error;
    }
  }

  async submit(user: RequestUser, input: InvestmentSubmitInput) {
    await this.assertEligible(user);
    const offering = await this.loadOffering(input.offeringId);
    const existing = await prisma.investmentOrder.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { position: true, subscription: true, account: true },
    });
    if (existing) {
      if (existing.account.userId !== user.id) {
        throw new ConflictException("Idempotency key already used");
      }
      if (moneyString(existing.requestedAmount) !== moneyString(input.amount)) {
        throw new ConflictException("Idempotency key was reused with a different amount");
      }
      return this.toPayload(existing.id);
    }

    const quote = await this.quote(user, { offeringId: input.offeringId, amount: input.amount });
    const account = await prisma.investorAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const open = await prisma.investmentPosition.findFirst({
      where: { investorAccountId: account.id, offeringId: offering.id, status: "OPEN" },
    });
    if (open) {
      throw new ConflictException("An open position already exists for this offering");
    }

    const envelope = await this.providers.eSignature.createEnvelope({
      userId: user.id,
      documentKey: "subscription-agreement",
    });
    const brokerage = await this.providers.brokerage.submitSubscription({
      userId: user.id,
      offeringId: offering.id,
      amount: quote.amount,
    });
    const bank = input.bankLinkToken
      ? { linkToken: input.bankLinkToken }
      : await this.providers.funding.createBankLinkToken(user.id);
    const transfer = await this.providers.funding.initiateTransfer({
      userId: user.id,
      amount: quote.amount,
      bankLinkToken: bank.linkToken,
    });
    await this.providers.custody.echoPosition({
      accountId: account.id,
      offeringId: offering.id,
      amount: quote.amount,
    });

    const version = offering.versions[0];
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.investmentOrder.create({
        data: {
          investorAccountId: account.id,
          offeringId: offering.id,
          idempotencyKey: input.idempotencyKey,
          requestedAmount: quote.amount,
          feeAmount: quote.feeAmount,
          status: InvestmentOrderStatus.SETTLED,
          brokerageOrderId: brokerage.orderId,
          fundingTransferId: transfer.transferId,
          envelopeId: envelope.envelopeId,
        },
      });
      await tx.investmentSubscription.create({
        data: {
          orderId: order.id,
          offeringId: offering.id,
          offeringVersion: version?.version ?? 1,
          amount: quote.amount,
          snapshot: {
            name: offering.name,
            minInvestment: moneyString(offering.minInvestment),
            creditRate: offering.taxCreditProgram ? moneyString(offering.taxCreditProgram.creditRate) : "0",
          },
        },
      });
      const position = await tx.investmentPosition.create({
        data: {
          investorAccountId: account.id,
          offeringId: offering.id,
          orderId: order.id,
          settledAmount: quote.amount,
          costBasis: quote.amount,
          currentValue: quote.amount,
          totalDistributions: "0.0000",
          status: "OPEN",
        },
      });
      const cashFlow = await tx.investmentCashFlow.create({
        data: {
          positionId: position.id,
          type: CashFlowType.CONTRIBUTION,
          amount: quote.amount,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return { order, position, cashFlow };
    });

    await this.providers.audit.write({
      actorUserId: user.id,
      actorRole: user.roles[0],
      action: "investment.submitted",
      entityType: "InvestmentOrder",
      entityId: created.order.id,
      afterJson: { amount: quote.amount, offeringId: offering.id, status: "SUBMITTED" },
      correlationId: randomUUID(),
    });
    await this.providers.audit.write({
      actorUserId: user.id,
      actorRole: user.roles[0],
      action: "investment.funded",
      entityType: "InvestmentOrder",
      entityId: created.order.id,
      afterJson: { transferId: transfer.transferId, amount: quote.amount },
      correlationId: randomUUID(),
    });
    await this.providers.audit.write({
      actorUserId: user.id,
      actorRole: user.roles[0],
      action: "investment.settled",
      entityType: "InvestmentPosition",
      entityId: created.position.id,
      afterJson: { amount: quote.amount, cashFlowId: created.cashFlow.id },
      correlationId: randomUUID(),
    });

    await prisma.valuation.create({
      data: {
        positionId: created.position.id,
        asOf: new Date(),
        value: quote.amount,
        source: "MANAGER_REPORT",
      },
    });
    const residency = await prisma.residencyVerification.findUnique({ where: { userId: user.id } });
    await this.taxCredits?.createOnSettle({
      userId: user.id,
      positionId: created.position.id,
      offeringId: offering.id,
      amount: quote.amount,
      residencyPassed: residency?.status === "passed",
    });
    await this.notifications?.notify({
      userId: user.id,
      type: NotificationType.investment_settled,
      title: "Investment settled",
      body: "Your demonstration investment has settled.",
      entityType: "InvestmentPosition",
      entityId: created.position.id,
    });
    noopAnalytics.track(AnalyticsEvent.SETTLED, { offeringId: offering.id });

    await prisma.portfolioActivity.createMany({
      data: [
        {
          userId: user.id,
          positionId: created.position.id,
          type: "contribution",
          title: "Contribution settled",
          body: `$${quote.amount} contributed.`,
        },
        {
          userId: user.id,
          positionId: created.position.id,
          type: "settlement",
          title: "Position opened",
          body: "Your demonstration position is open. Any tax credit remains pending Commerce certification.",
        },
      ],
    });

    return this.toPayload(created.order.id);
  }

  async createPlaidLink(user: RequestUser) {
    await this.assertEligible(user);
    const session = await this.providers.funding.createPlaidLinkSession(user.id);
    return {
      ...session,
      labeledAs: "Plaid",
      copy:
        session.mode === "plaid"
          ? "Connect your bank with Plaid. InvestRI never sees your login."
          : "Plaid Link sandbox. This demonstration never stores a login, routing number, or account number.",
    };
  }

  async exchangePlaid(user: RequestUser, input: PlaidExchangeInput) {
    await this.assertEligible(user);
    const account = await this.providers.funding.exchangePlaidPublicToken({
      userId: user.id,
      publicToken: input.publicToken,
      institutionId: input.institutionId,
    });
    await this.providers.audit.write({
      actorUserId: user.id,
      actorRole: user.roles[0],
      action: "funding.plaid_linked",
      entityType: "FundingAccount",
      entityId: account.accountId,
      afterJson: {
        institutionName: account.institutionName,
        accountType: account.accountType,
        mask: account.mask,
      },
      correlationId: randomUUID(),
    });
    return {
      bankLinkToken: account.linkToken,
      linkToken: account.linkToken,
      institutionName: account.institutionName,
      accountName: account.accountName,
      accountType: account.accountType,
      mask: account.mask,
    };
  }

  async get(user: RequestUser, id: string) {
    await this.assertEligible(user);
    return this.toPayload(id, user.id);
  }

  private async toPayload(orderId: string, userId?: string) {
    const order = await prisma.investmentOrder.findUnique({
      where: { id: orderId },
      include: {
        account: true,
        offering: { include: { taxCreditProgram: true } },
        position: { include: { cashFlows: true } },
        subscription: true,
      },
    });
    if (!order || (userId && order.account.userId !== userId)) {
      throw new NotFoundException("Investment not found");
    }
    const creditRate = order.offering.taxCreditProgram
      ? moneyString(order.offering.taxCreditProgram.creditRate)
      : "0";
    const quote = quoteInvestment({
      amount: moneyString(order.requestedAmount),
      minInvestment: moneyString(order.offering.minInvestment),
      creditRate,
      feeAmount: moneyString(order.feeAmount),
    });
    return {
      order: {
        id: order.id,
        status: order.status,
        requestedAmount: moneyString(order.requestedAmount),
        feeAmount: moneyString(order.feeAmount),
        offeringId: order.offeringId,
        envelopeId: order.envelopeId,
        brokerageOrderId: order.brokerageOrderId,
        fundingTransferId: order.fundingTransferId,
      },
      position: order.position
        ? {
            id: order.position.id,
            settledAmount: moneyString(order.position.settledAmount),
            costBasis: moneyString(order.position.costBasis),
            currentValue: moneyString(order.position.currentValue),
            status: order.position.status,
          }
        : null,
      cashFlow: order.position?.cashFlows[0]
        ? {
            id: order.position.cashFlows[0].id,
            type: order.position.cashFlows[0].type,
            amount: moneyString(order.position.cashFlows[0].amount),
          }
        : null,
      taxCredit: {
        potentialCredit: quote.potentialCredit,
        status: CREDIT_PENDING,
        programStatus: order.offering.taxCreditProgram?.status ?? null,
        disclaimer:
          "This credit is estimated and pending Commerce certification. You have not received a credit.",
      },
    };
  }

  private async loadOffering(offeringId: string) {
    const offering = await prisma.offering.findUnique({
      where: { id: offeringId },
      include: {
        taxCreditProgram: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!offering) {
      throw new NotFoundException("Offering not found");
    }
    return offering;
  }

  private async assertEligible(user: RequestUser) {
    const status = await this.onboarding.getStatus(user);
    if (!status.eligibleToInvest) {
      throw new ForbiddenException({
        message: "Complete onboarding before investing",
        nextStep: status.nextStep,
        onboardingStatus: status.status,
      });
    }
  }
}
