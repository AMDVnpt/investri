import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { prisma } from "@investri/database";
import { RoleName } from "@investri/domain";
import { ImpactService } from "./impact.service";
import type { RequestUser } from "../common/current-user";

let impact: ImpactService;
let alex: RequestUser;

beforeAll(async () => {
  impact = new ImpactService();
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "alex.smith@demo.investri.ri" } });
  alex = { id: user.id, email: user.email, roles: [RoleName.CITIZEN_INVESTOR] };
});

describe("impact", () => {
  it("returns seeded totals without attributing units to $1,000", async () => {
    await prisma.impactEvidence.deleteMany({
      where: { report: { source: "test" } },
    });
    await prisma.impactMetricReport.deleteMany({
      where: { source: "test" },
    });
    const newport = await prisma.project.findUniqueOrThrow({ where: { slug: "ocean-technology-expansion" } });
    const jobsDef = await prisma.impactMetricDefinition.findUniqueOrThrow({ where: { key: "jobs" } });
    const pending = await prisma.impactMetricReport.findFirst({
      where: { projectId: newport.id, verificationStatus: "PENDING_VERIFICATION" },
    });
    if (!pending) {
      await prisma.impactMetricReport.create({
        data: {
          projectId: newport.id,
          definitionId: jobsDef.id,
          value: "4.0000",
          source: "manager@narragansett.example",
          period: "2026 addendum",
          verificationStatus: "PENDING_VERIFICATION",
        },
      });
    }
    const summary = await impact.summary(alex);
    expect(summary.totals.dollarsDeployed).toBe("13750000.0000");
    expect(summary.totals.housingUnits).toBe("182.0000");
    expect(summary.totals.jobs).toBe("35.0000");
    expect(summary.totals.businesses).toBe("40.0000");
    expect(summary.totals.municipalities).toBe(3);
    expect(summary.personalized?.investedAmount).toBe("1000.0000");
    expect(summary.personalized?.copy).not.toMatch(/72 housing/);
    expect(summary.includesSelfReported).toBe(true);
  });

  it("omits personalization when there is no position", async () => {
    const summary = await impact.summary();
    expect(summary.personalized).toBeNull();
  });

  it("lets a manager submit and a reviewer verify with audit", async () => {
    const project = await prisma.project.findUniqueOrThrow({ where: { slug: "ocean-technology-expansion" } });
    const manager: RequestUser = {
      id: (await prisma.user.findUniqueOrThrow({ where: { email: "manager@demo.investri.ri" } })).id,
      email: "manager@demo.investri.ri",
      roles: [RoleName.FUND_MANAGER],
    };
    const report = await impact.submit(manager, project.id, {
      definitionKey: "jobs",
      value: "2.0000",
      source: "test",
      period: "2026-test",
    });
    expect(report.verificationStatus).toBe("PENDING_VERIFICATION");
    const before = await prisma.auditEvent.count({ where: { action: "impact.verified" } });
    const reviewer: RequestUser = {
      id: (await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@commerce.ri.gov" } })).id,
      email: "reviewer@commerce.ri.gov",
      roles: [RoleName.COMMERCE_REVIEWER],
    };
    await expect(
      impact.decide(manager, report.id, "VERIFIED", { reason: "no", reasonCode: "NO" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      impact.decide(reviewer, report.id, "REJECTED", { reason: "", reasonCode: "" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await impact.decide(reviewer, report.id, "VERIFIED", { reason: "Demo", reasonCode: "DEMO_POC" });
    const updated = await prisma.impactMetricReport.findUniqueOrThrow({ where: { id: report.id } });
    expect(updated.verificationStatus).toBe("VERIFIED");
    expect(await prisma.auditEvent.count({ where: { action: "impact.verified" } })).toBe(before + 1);
  });
});
