import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@investri/database";
import {
  ImpactVerificationStatus,
  RoleName,
  aggregateImpact,
  money,
  moneyString,
} from "@investri/domain";
import { randomUUID } from "node:crypto";
import { noopAnalytics, AnalyticsEvent } from "@investri/analytics";
import type { RequestUser } from "../common/current-user";
import type { ImpactSubmitInput } from "@investri/validation";
import { NotificationType, NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ImpactService {
  constructor(private readonly notifications?: NotificationsService) {}
  async summary(user?: RequestUser) {
    const projects = await prisma.project.findMany({
      include: {
        locations: true,
        investments: { include: { offering: { select: { id: true, name: true, status: true } } } },
        metrics: { include: { definition: true } },
        milestones: { orderBy: { occurredAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    });
    const reports = projects.flatMap((project) =>
      project.metrics.map((row) => ({
        key: row.definition.key,
        value: moneyString(row.value),
        verificationStatus: row.verificationStatus,
      })),
    );
    const verified = aggregateImpact(
      reports.filter((row) => row.verificationStatus === ImpactVerificationStatus.VERIFIED),
    );
    const all = aggregateImpact(reports);
    const deployed = projects.reduce(
      (sum, project) =>
        project.investments.reduce((inner, row) => inner.add(money(moneyString(row.amountDeployed))), sum),
      money("0"),
    );
    const municipalities = new Set(
      projects
        .map((project) => project.locations[0])
        .filter((row) => row && !row.isStatewide)
        .map((row) => row!.municipality),
    );

    let personalized: {
      investedAmount: string;
      offeringId: string;
      offeringName: string;
      copy: string;
    } | null = null;
    if (user) {
      const position = await prisma.investmentPosition.findFirst({
        where: { account: { userId: user.id }, status: "OPEN" },
        include: { offering: true },
      });
      if (position) {
        personalized = {
          investedAmount: moneyString(position.settledAmount),
          offeringId: position.offeringId,
          offeringName: position.offering.name,
          copy: `Your $${moneyString(position.settledAmount).split(".")[0]} is part of ${position.offering.name}, which has deployed $${moneyString(deployed).split(".")[0]} across these projects. Units and jobs are fund-level outcomes, not attributed to your subscription.`,
        };
      }
    }

    noopAnalytics.track(AnalyticsEvent.IMPACT_VIEWED, { authenticated: Boolean(user) });

    return {
      illustrative: true,
      totals: {
        dollarsDeployed: moneyString(deployed),
        projectsSupported: projects.length,
        housingUnits: verified.totals.housing_units ?? "0.0000",
        jobs: verified.totals.jobs ?? "0.0000",
        businesses: verified.totals.businesses ?? "0.0000",
        historicBuildings: verified.totals.historic_buildings ?? "0.0000",
        municipalities: municipalities.size,
      },
      includesSelfReported: all.includesSelfReported,
      personalized,
      map: {
        pins: projects.map((project) => ({
          id: project.id,
          name: project.name,
          municipality: project.locations[0]?.municipality ?? "Rhode Island",
          statewide: project.locations[0]?.isStatewide ?? false,
          sector: project.sector,
          status: project.status,
          latitude: project.locations[0]?.latitude ? moneyString(project.locations[0].latitude, 6) : null,
          longitude: project.locations[0]?.longitude ? moneyString(project.locations[0].longitude, 6) : null,
          heroImageUrl: project.heroImageUrl,
        })),
      },
      projects: projects.map((project) => this.toCard(project)),
    };
  }

  async project(id: string) {
    const project = await prisma.project.findFirst({
      where: { id },
      include: {
        locations: true,
        investments: { include: { offering: true } },
        metrics: { include: { definition: true, evidence: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!project || !project.investments.length) {
      throw new NotFoundException("Project not found");
    }
    return {
      ...this.toCard(project),
      description: project.description,
      useOfCapital: project.useOfCapital,
      capitalStack: project.capitalStackJson,
      beforeImageUrl: project.beforeImageUrl,
      afterImageUrl: project.afterImageUrl,
      imageAlt: project.imageAlt,
      imageCredit: project.imageCredit,
      milestones: project.milestones,
      latestMilestone: project.milestones[project.milestones.length - 1] ?? null,
      offerings: project.investments.map((row) => ({
        id: row.offering.id,
        name: row.offering.name,
        amountDeployed: moneyString(row.amountDeployed),
      })),
      metrics: project.metrics.map((row) => ({
        id: row.id,
        key: row.definition.key,
        label: row.definition.label,
        unit: row.definition.unit,
        value: moneyString(row.value),
        source: row.source,
        period: row.period,
        verificationStatus: row.verificationStatus,
        evidence: row.evidence,
      })),
    };
  }

  async managerProjects() {
    return prisma.project.findMany({
      include: {
        locations: true,
        investments: true,
        metrics: { include: { definition: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async submit(actor: RequestUser, projectId: string, input: ImpactSubmitInput) {
    const definition = await prisma.impactMetricDefinition.findUnique({
      where: { key: input.definitionKey },
    });
    if (!definition) {
      throw new NotFoundException("Unknown metric");
    }
    const report = await prisma.impactMetricReport.create({
      data: {
        projectId,
        definitionId: definition.id,
        value: input.value,
        source: input.source,
        period: input.period,
        verificationStatus: ImpactVerificationStatus.PENDING_VERIFICATION,
        evidence: input.evidenceUrl
          ? { create: { label: "Manager evidence", url: input.evidenceUrl } }
          : undefined,
      },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.roles[0],
        action: "impact.reported",
        entityType: "ImpactMetricReport",
        entityId: report.id,
        afterJson: { definitionKey: input.definitionKey, value: input.value },
        correlationId: randomUUID(),
      },
    });
    return report;
  }

  async adminQueue() {
    return prisma.impactMetricReport.findMany({
      include: { project: true, definition: true, evidence: true },
      orderBy: [{ verificationStatus: "asc" }, { id: "desc" }],
    });
  }

  async decide(
    actor: RequestUser,
    reportId: string,
    status: "VERIFIED" | "REJECTED",
    input: { reason: string; reasonCode: string },
  ) {
    if (actor.roles.includes(RoleName.FUND_MANAGER) && !actor.roles.includes(RoleName.SYSTEM_ADMIN)) {
      throw new ForbiddenException("Fund managers cannot verify impact");
    }
    if (!input.reason?.trim() || !input.reasonCode?.trim()) {
      throw new BadRequestException("Reason and reasonCode are required");
    }
    const updated = await prisma.impactMetricReport.update({
      where: { id: reportId },
      data: { verificationStatus: status },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.roles[0],
        action: status === "VERIFIED" ? "impact.verified" : "impact.rejected",
        entityType: "ImpactMetricReport",
        entityId: reportId,
        afterJson: { status, reasonCode: input.reasonCode },
        reasonCode: input.reasonCode,
        correlationId: randomUUID(),
      },
    });
    if (status === "VERIFIED") {
      const holders = await prisma.investmentPosition.findMany({
        where: { offering: { projectInvestments: { some: { projectId: updated.projectId } } } },
        include: { account: true },
      });
      for (const position of holders) {
        await this.notifications?.notify({
          userId: position.account.userId,
          type: NotificationType.project_milestone,
          title: "Project update",
          body: "A project metric was verified.",
          entityType: "ImpactMetricReport",
          entityId: `${reportId}-${position.account.userId}`,
        });
      }
    }
    return updated;
  }

  private toCard(project: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    status: string;
    isIllustrative: boolean;
    heroImageUrl: string | null;
    locations: { municipality: string; isStatewide: boolean }[];
    investments: { amountDeployed: { toString(): string } }[];
  }) {
    const deployed = project.investments.reduce(
      (sum, row) => sum.add(money(moneyString(row.amountDeployed.toString()))),
      money("0"),
    );
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      sector: project.sector,
      status: project.status,
      isIllustrative: project.isIllustrative,
      heroImageUrl: project.heroImageUrl,
      municipality: project.locations[0]?.municipality ?? "Rhode Island",
      statewide: project.locations[0]?.isStatewide ?? false,
      amountDeployed: moneyString(deployed),
    };
  }
}
