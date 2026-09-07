import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@investri/database";
import { money, moneyString, portfolioTotals } from "@investri/domain";
import type { RequestUser } from "../common/current-user";

@Injectable()
export class PortfolioService {
  async summary(user: RequestUser) {
    const account = await prisma.investorAccount.findUnique({
      where: { userId: user.id },
      include: {
        positions: {
          include: {
            offering: {
              include: {
                taxCreditProgram: true,
                allocations: { orderBy: { sortOrder: "asc" } },
                projectInvestments: { include: { project: { include: { locations: true } } } },
                updates: { orderBy: { publishedAt: "desc" }, take: 1 },
              },
            },
            cashFlows: { orderBy: { occurredAt: "asc" } },
            valuations: { orderBy: { asOf: "asc" } },
            distributions: { orderBy: { paidAt: "asc" } },
          },
        },
      },
    });
    const positions = account?.positions ?? [];
    const contributions = positions.reduce(
      (sum, position) => sum.add(money(moneyString(position.settledAmount))),
      money("0"),
    );
    const distributions = positions.reduce(
      (sum, position) => sum.add(money(moneyString(position.totalDistributions))),
      money("0"),
    );
    const currentValue = positions.reduce(
      (sum, position) => sum.add(money(moneyString(position.currentValue))),
      money("0"),
    );
    const costBasis = positions.reduce(
      (sum, position) => sum.add(money(moneyString(position.costBasis))),
      money("0"),
    );
    const totals = portfolioTotals({
      contributions: moneyString(contributions),
      distributions: moneyString(distributions),
      currentValue: moneyString(currentValue),
      costBasis: moneyString(costBasis),
    });

    const entitlements = await prisma.taxCreditEntitlement.findMany({
      where: { userId: user.id },
    });
    const estimated = entitlements.reduce(
      (sum, row) => sum.add(money(moneyString(row.potentialCredit))),
      money("0"),
    );
    const earned = entitlements.reduce(
      (sum, row) => sum.add(money(moneyString(row.earnedCredit))),
      money("0"),
    );
    const certified = entitlements.reduce(
      (sum, row) => sum.add(money(moneyString(row.certifiedCredit))),
      money("0"),
    );
    const claimed = entitlements.reduce(
      (sum, row) => sum.add(money(moneyString(row.claimedCredit))),
      money("0"),
    );
    const available = certified.sub(claimed);
    const certifiedPreview = moneyString(certified);

    const valueSeries = positions.flatMap((position) =>
      position.valuations.map((row) => ({
        asOf: row.asOf,
        value: moneyString(row.value),
        source: row.source,
        kind: "value" as const,
      })),
    );
    const cashFlows = positions.flatMap((position) =>
      position.cashFlows.map((row) => ({
        id: row.id,
        type: row.type,
        amount: moneyString(row.amount),
        occurredAt: row.occurredAt,
      })),
    );

    const allocation = positions[0]?.offering.allocations.map((row) => ({
      key: row.key,
      label: row.label,
      percentage: moneyString(row.percentage, 6),
    })) ?? [];

    const municipalities = new Map<string, ReturnType<typeof money>>();
    for (const position of positions) {
      for (const investment of position.offering.projectInvestments) {
        const place = investment.project.locations[0]?.isStatewide
          ? "Statewide"
          : (investment.project.locations[0]?.municipality ?? "Rhode Island");
        const current = municipalities.get(place) ?? money("0");
        municipalities.set(place, current.add(money(moneyString(investment.amountDeployed))));
      }
    }

    const activities = await prisma.portfolioActivity.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 12,
    });

    const projectsSupported = new Set(
      positions.flatMap((position) => position.offering.projectInvestments.map((row) => row.projectId)),
    ).size;
    const dollarsInRi = [...municipalities.values()].reduce((sum, value) => sum.add(value), money("0"));

    return {
      empty: positions.length === 0,
      totals,
      taxCredit: {
        potentialCredit: moneyString(estimated),
        certifiedPreview,
        availablePreview: moneyString(available.lt(0) ? money("0") : available),
        proposed: true,
        status: certified.gt(0) ? "certified" : "pending_commerce_certification",
        buckets: {
          estimated: moneyString(estimated),
          earned: moneyString(earned),
          certified: moneyString(certified),
          available: moneyString(available.lt(0) ? money("0") : available),
          claimed: moneyString(claimed),
        },
        copy:
          certified.gt(0)
            ? "A portion of this credit has been certified. It is still proposed legislation and is not cash."
            : "Estimated until Commerce certifies. You have not received this credit.",
      },
      impact: {
        projectsSupported,
        dollarsInRi: moneyString(dollarsInRi),
      },
      valueSeries,
      cashFlows,
      distributions: positions
        .flatMap((position) =>
          position.distributions.map((row) => ({
            id: row.id,
            positionId: position.id,
            offeringName: position.offering.name,
            amount: moneyString(row.amount),
            paidAt: row.paidAt,
            periodLabel: row.periodLabel,
          })),
        )
        .sort((left, right) => +new Date(right.paidAt) - +new Date(left.paidAt)),
      allocations: allocation,
      municipalities: [...municipalities.entries()].map(([name, amount]) => ({
        name,
        amount: moneyString(amount),
      })),
      positions: positions.map((position) => ({
        id: position.id,
        offeringId: position.offeringId,
        offeringName: position.offering.name,
        settledAmount: moneyString(position.settledAmount),
        currentValue: moneyString(position.currentValue),
        totalDistributions: moneyString(position.totalDistributions),
      })),
      featuredOffering: positions[0]
        ? { id: positions[0].offering.id, name: positions[0].offering.name }
        : null,
      latestUpdate: positions[0]?.offering.updates[0] ?? null,
      activity: activities.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        occurredAt: row.occurredAt,
        positionId: row.positionId,
      })),
    };
  }

  async position(user: RequestUser, id: string) {
    const position = await prisma.investmentPosition.findFirst({
      where: { id, account: { userId: user.id } },
      include: {
        offering: {
          include: {
            taxCreditProgram: true,
            updates: { orderBy: { publishedAt: "desc" }, take: 1 },
          },
        },
        cashFlows: { orderBy: { occurredAt: "desc" } },
        valuations: { orderBy: { asOf: "asc" } },
        distributions: { orderBy: { paidAt: "desc" } },
        documents: { orderBy: { publishedAt: "desc" } },
        activities: { orderBy: { occurredAt: "desc" } },
      },
    });
    if (!position) {
      throw new NotFoundException("Position not found");
    }
    const totals = portfolioTotals({
      contributions: moneyString(position.settledAmount),
      distributions: moneyString(position.totalDistributions),
      currentValue: moneyString(position.currentValue),
      costBasis: moneyString(position.costBasis),
    });
    const entitlement = await prisma.taxCreditEntitlement.findUnique({
      where: { positionId: position.id },
      include: { certificates: { where: { voidedAt: null }, orderBy: { issuedAt: "desc" } } },
    });
    const estimated = entitlement ? money(moneyString(entitlement.potentialCredit)) : money("0");
    const earned = entitlement ? money(moneyString(entitlement.earnedCredit)) : money("0");
    const certified = entitlement ? money(moneyString(entitlement.certifiedCredit)) : money("0");
    const claimed = entitlement ? money(moneyString(entitlement.claimedCredit)) : money("0");
    const available = certified.sub(claimed);
    return {
      id: position.id,
      offeringId: position.offeringId,
      offeringName: position.offering.name,
      termMonths: position.offering.targetTermMonths,
      distributionFrequency: position.offering.distributionFrequency,
      settledAmount: moneyString(position.settledAmount),
      currentValue: moneyString(position.currentValue),
      totals,
      latestUpdate: position.offering.updates[0] ?? null,
      taxCredit: {
        entitlementId: entitlement?.id ?? null,
        potentialCredit: moneyString(estimated),
        certifiedPreview: moneyString(certified),
        proposed: true,
        status: entitlement?.status ?? "pending_commerce_certification",
        buckets: {
          estimated: moneyString(estimated),
          earned: moneyString(earned),
          certified: moneyString(certified),
          available: moneyString(available.lt(0) ? money("0") : available),
          claimed: moneyString(claimed),
        },
        certificates: entitlement?.certificates ?? [],
        copy:
          certified.gt(0)
            ? "A portion of this credit has been certified. It is still proposed legislation and is not cash."
            : "Proposed / pending — you have not received this credit.",
      },
      documents: position.documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        url: doc.url,
      })),
      activity: position.activities,
      distributions: position.distributions.map((row) => ({
        id: row.id,
        amount: moneyString(row.amount),
        paidAt: row.paidAt,
        periodLabel: row.periodLabel,
      })),
      cashFlows: position.cashFlows.map((row) => ({
        id: row.id,
        type: row.type,
        amount: moneyString(row.amount),
        occurredAt: row.occurredAt,
      })),
      valueSeries: position.valuations.map((row) => ({
        asOf: row.asOf,
        value: moneyString(row.value),
        kind: "value",
      })),
    };
  }

  async documents(
    user: RequestUser,
    query: { taxYear?: string; positionId?: string; category?: string },
  ) {
    const taxYear = query.taxYear ? Number(query.taxYear) : undefined;
    return prisma.investorDocument.findMany({
      where: {
        userId: user.id,
        taxYear: Number.isFinite(taxYear) ? taxYear : undefined,
        positionId: query.positionId,
        category: query.category,
      },
      orderBy: { publishedAt: "desc" },
    });
  }
}
