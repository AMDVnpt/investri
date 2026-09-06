import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { prisma } from "@investri/database";
import { OfferingStatus, RoleName } from "@investri/domain";
import { offeringActionSchema } from "@investri/validation";
import { TaxCreditEngineService } from "../tax-credits/tax-credit-engine.service";
import { AdminService } from "./admin.service";
import type { RequestUser } from "../common/current-user";

let admin: AdminService;
let engine: TaxCreditEngineService;
let offeringId: string;

const reviewer: RequestUser = {
  id: "reviewer-test",
  email: "reviewer@commerce.ri.gov",
  roles: [RoleName.COMMERCE_TAX_ADMIN, RoleName.SYSTEM_ADMIN],
};

beforeAll(async () => {
  engine = new TaxCreditEngineService();
  admin = new AdminService(engine);
  offeringId = (await prisma.offering.findUniqueOrThrow({ where: { slug: "investri-growth-fund-i" } })).id;
  const reviewerRow = await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@commerce.ri.gov" } });
  reviewer.id = reviewerRow.id;
});

describe("commerce admin", () => {
  it("lets a reviewer certify and rejects a fund manager", async () => {
    const entitlement = await prisma.taxCreditEntitlement.findFirstOrThrow({
      where: { status: { in: ["pending_commerce_review", "certified"] } },
    });
    await expect(
      engine.certify(
        { id: "mgr", email: "manager@demo.investri.ri", roles: [RoleName.FUND_MANAGER] },
        entitlement.id,
        { amount: "10.0000", reason: "no", reasonCode: "NO" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("requires a reason code on pause and writes an append-only audit row", async () => {
    expect(offeringActionSchema.safeParse({ reason: "x" }).success).toBe(false);
    const before = await prisma.auditEvent.count({
      where: { entityId: offeringId, action: { in: ["offering.paused", "offering.live"] } },
    });
    await expect(
      admin.transitionOffering(reviewer, offeringId, OfferingStatus.PAUSED, { reason: "", reasonCode: "" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await admin.transitionOffering(reviewer, offeringId, OfferingStatus.PAUSED, {
      reason: "Demo pause",
      reasonCode: "DEMO_PAUSE",
    });
    await admin.transitionOffering(reviewer, offeringId, OfferingStatus.LIVE, {
      reason: "Restore live",
      reasonCode: "DEMO_RESTORE",
    });
    const offering = await prisma.offering.findUniqueOrThrow({ where: { id: offeringId } });
    expect(offering.status).toBe("LIVE");
    expect(
      await prisma.auditEvent.count({
        where: { entityId: offeringId, action: { in: ["offering.paused", "offering.live"] } },
      }),
    ).toBe(before + 2);
  });

  it("matches dashboard remaining cap to the ledger", async () => {
    const dash = await admin.dashboard();
    const program = await prisma.taxCreditProgram.findFirstOrThrow();
    expect(dash.taxCredits.remainingCap).toBe(await engine.remainingCap(program.id));
    expect(dash.illustrative).toBe(true);
  });

  it("rejects over-cap certify without writing another certificate", async () => {
    const entitlement = await prisma.taxCreditEntitlement.findFirstOrThrow();
    const before = await prisma.taxCreditCertificate.count({ where: { entitlementId: entitlement.id } });
    await expect(
      engine.certify(reviewer, entitlement.id, {
        amount: "50000001.0000",
        reason: "too much",
        reasonCode: "OVER",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    const after = await prisma.taxCreditCertificate.count({ where: { entitlementId: entitlement.id } });
    expect(after).toBe(before);
  });
});
