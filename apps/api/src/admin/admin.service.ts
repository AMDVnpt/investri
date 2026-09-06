import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { prisma } from "@investri/database";
import {
  OfferingStatus,
  RoleName,
  TaxCreditStatus,
  canTransitionOffering,
  money,
  moneyString,
} from "@investri/domain";
import { randomUUID } from "node:crypto";
import type { RequestUser } from "../common/current-user";
import { TaxCreditEngineService } from "../tax-credits/tax-credit-engine.service";

@Injectable()
export class AdminService {
  constructor(private readonly taxCredits: TaxCreditEngineService) {}

  async dashboard() {
    const [citizens, residents, accounts, liveOfferings, orders, positions, projectInvestments, entitlements, exceptions, recapture] =
      await Promise.all([
        prisma.userRole.count({ where: { role: { name: "CITIZEN_INVESTOR" } } }),
        prisma.residencyVerification.count({ where: { status: "passed", state: "RI" } }),
        prisma.investorAccount.count({ where: { positions: { some: {} } } }),
        prisma.offering.count({ where: { status: "LIVE" } }),
        prisma.investmentOrder.findMany({ select: { requestedAmount: true, status: true } }),
        prisma.investmentPosition.findMany(),
        prisma.projectInvestment.findMany({
          include: { project: { include: { locations: true } } },
        }),
        prisma.taxCreditEntitlement.findMany(),
        this.compliance(),
        prisma.taxCreditEntitlement.findMany({ where: { status: TaxCreditStatus.recapture_review } }),
      ]);

    const committed = orders.reduce((sum, row) => sum.add(money(moneyString(row.requestedAmount))), money("0"));
    const settled = positions.reduce((sum, row) => sum.add(money(moneyString(row.settledAmount))), money("0"));
    const deployed = projectInvestments.reduce(
      (sum, row) => sum.add(money(moneyString(row.amountDeployed))),
      money("0"),
    );
    const distributions = positions.reduce(
      (sum, row) => sum.add(money(moneyString(row.totalDistributions))),
      money("0"),
    );
    const reserved = entitlements.reduce((sum, row) => sum.add(money(moneyString(row.potentialCredit))), money("0"));
    const earned = entitlements.reduce((sum, row) => sum.add(money(moneyString(row.earnedCredit))), money("0"));
    const certified = entitlements.reduce((sum, row) => sum.add(money(moneyString(row.certifiedCredit))), money("0"));
    const claimed = entitlements.reduce((sum, row) => sum.add(money(moneyString(row.claimedCredit))), money("0"));
    const program = await prisma.taxCreditProgram.findFirst({ orderBy: { createdAt: "asc" } });
    const remainingCap = program ? await this.taxCredits.remainingCap(program.id) : "0.0000";

    const municipalities = new Map<string, ReturnType<typeof money>>();
    for (const investment of projectInvestments) {
      const place = investment.project.locations[0]?.isStatewide
        ? "Statewide"
        : (investment.project.locations[0]?.municipality ?? "Rhode Island");
      municipalities.set(
        place,
        (municipalities.get(place) ?? money("0")).add(money(moneyString(investment.amountDeployed))),
      );
    }

    return {
      illustrative: true,
      citizens,
      verifiedResidents: residents,
      activeInvestors: accounts,
      liveOfferings,
      capital: {
        committed: moneyString(committed),
        settled: moneyString(settled),
        deployed: moneyString(deployed),
        distributions: moneyString(distributions),
      },
      taxCredits: {
        reserved: moneyString(reserved),
        earned: moneyString(earned),
        certified: moneyString(certified),
        claimed: moneyString(claimed),
        remainingCap,
      },
      complianceExceptions: exceptions.length,
      recaptureExposure: moneyString(
        recapture.reduce((sum, row) => sum.add(money(moneyString(row.potentialCredit))), money("0")),
      ),
      municipalities: [...municipalities.entries()].map(([name, amount]) => ({
        name,
        amount: moneyString(amount),
      })),
    };
  }

  async transitionOffering(
    actor: RequestUser,
    id: string,
    to: OfferingStatus,
    input: { reason: string; reasonCode: string },
  ) {
    if (actor.roles.includes(RoleName.FUND_MANAGER) && !actor.roles.includes(RoleName.SYSTEM_ADMIN)) {
      throw new ForbiddenException("Fund managers cannot change offering status");
    }
    if (!input.reason?.trim() || !input.reasonCode?.trim()) {
      throw new BadRequestException("Reason and reasonCode are required");
    }
    const offering = await prisma.offering.findUnique({ where: { id } });
    if (!offering) {
      throw new NotFoundException("Offering not found");
    }
    if (!canTransitionOffering(offering.status as OfferingStatus, to)) {
      throw new UnprocessableEntityException(`Cannot move ${offering.status} to ${to}`);
    }
    const updated = await prisma.offering.update({
      where: { id },
      data: { status: to },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.roles[0],
        action: `offering.${to.toLowerCase()}`,
        entityType: "Offering",
        entityId: id,
        beforeJson: { status: offering.status },
        afterJson: { status: to },
        reasonCode: input.reasonCode,
        correlationId: randomUUID(),
      },
    });
    return updated;
  }

  async investors(query?: string) {
    return prisma.user.findMany({
      where: {
        roles: { some: { role: { name: "CITIZEN_INVESTOR" } } },
        OR: query
          ? [
              { email: { contains: query, mode: "insensitive" } },
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
            ]
          : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        residencyVerification: { select: { status: true, city: true, state: true } },
        investorAccount: { select: { positions: { select: { id: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async investments(query?: { offeringId?: string; status?: string }) {
    return prisma.investmentOrder.findMany({
      where: {
        offeringId: query?.offeringId,
        status: query?.status as never,
      },
      include: {
        offering: { select: { name: true, slug: true } },
        account: { include: { user: { select: { email: true, firstName: true, lastName: true } } } },
        position: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async compliance() {
    const [identity, residency, eligibility] = await Promise.all([
      prisma.identityVerification.findMany({
        where: { status: "failed" },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.residencyVerification.findMany({
        where: { status: "failed" },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.investorEligibility.findMany({
        where: { status: "failed" },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
    ]);
    return [
      ...identity.map((row) => ({
        kind: "identity",
        userId: row.userId,
        email: row.user.email,
        name: `${row.user.firstName} ${row.user.lastName}`,
        status: row.status,
        reason: row.lastErrorReason,
      })),
      ...residency.map((row) => ({
        kind: "residency",
        userId: row.userId,
        email: row.user.email,
        name: `${row.user.firstName} ${row.user.lastName}`,
        status: row.status,
        reason: row.lastErrorReason,
      })),
      ...eligibility.map((row) => ({
        kind: "eligibility",
        userId: row.userId,
        email: row.user.email,
        name: `${row.user.firstName} ${row.user.lastName}`,
        status: row.status,
        reason: row.reasonCode,
      })),
    ];
  }

  async auditEvents(query?: { action?: string; entityType?: string }) {
    return prisma.auditEvent.findMany({
      where: {
        action: query?.action,
        entityType: query?.entityType,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async reportsCsv() {
    const dash = await this.dashboard();
    const lines = [
      "section,name,amount",
      `capital,committed,${dash.capital.committed}`,
      `capital,settled,${dash.capital.settled}`,
      `capital,deployed,${dash.capital.deployed}`,
      `tax,reserved,${dash.taxCredits.reserved}`,
      `tax,certified,${dash.taxCredits.certified}`,
      `tax,remaining_cap,${dash.taxCredits.remainingCap}`,
      ...dash.municipalities.map((row) => `municipality,${row.name},${row.amount}`),
    ];
    return lines.join("\n");
  }

  async recaptureReview(actor: RequestUser, id: string, input: { reason: string; reasonCode: string }) {
    if (!input.reason?.trim() || !input.reasonCode?.trim()) {
      throw new BadRequestException("Reason and reasonCode are required");
    }
    const entitlement = await prisma.taxCreditEntitlement.update({
      where: { id },
      data: { status: TaxCreditStatus.recapture_review },
    });
    await prisma.taxCreditRecaptureCase.create({
      data: {
        entitlementId: id,
        status: "open",
        reason: input.reason,
        reasonCode: input.reasonCode,
      },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.roles[0],
        action: "tax_credit.recapture_review",
        entityType: "TaxCreditEntitlement",
        entityId: id,
        afterJson: { reasonCode: input.reasonCode },
        reasonCode: input.reasonCode,
        correlationId: randomUUID(),
      },
    });
    return entitlement;
  }

  async programs() {
    return prisma.taxCreditProgram.findMany({ include: { schedules: true, caps: true } });
  }

  demoReset(actor: RequestUser, allowed: boolean) {
    if (!allowed) {
      throw new NotFoundException();
    }
    if (!actor.roles.includes(RoleName.SYSTEM_ADMIN)) {
      throw new ForbiddenException("Only a system admin can reset the demo");
    }
    return { ok: true, message: "Run pnpm demo:reset on the host" };
  }
}
