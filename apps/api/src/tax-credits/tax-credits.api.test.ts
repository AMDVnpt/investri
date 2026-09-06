import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { ConflictException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@investri/database";
import { ONBOARDING_DISCLOSURE_KEYS, RoleName } from "@investri/domain";
import { createProviders } from "@investri/providers";
import { loadConfig } from "@investri/config";
import { randomUUID } from "node:crypto";
import { AuthService } from "../auth/auth.service";
import { OnboardingService } from "../onboarding/onboarding.service";
import { InvestmentsService } from "../investments/investments.service";
import { PrismaAuditSink } from "../providers/audit.sink";
import { TaxCreditEngineService } from "./tax-credit-engine.service";
import type { RequestUser } from "../common/current-user";

const config = loadConfig();
let auth: AuthService;
let investments: InvestmentsService;
let engine: TaxCreditEngineService;
let offeringId: string;

beforeAll(async () => {
  const jwt = new JwtService({
    secret: config.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: config.JWT_ACCESS_TTL as `${number}m` },
  });
  auth = new AuthService(jwt);
  const providers = createProviders(config, new PrismaAuditSink());
  const onboarding = new OnboardingService(providers);
  engine = new TaxCreditEngineService();
  investments = new InvestmentsService(providers, onboarding, engine);
  offeringId = (await prisma.offering.findUniqueOrThrow({ where: { slug: "investri-growth-fund-i" } })).id;
});

async function eligibleUser() {
  const tokens = await auth.register({
    email: `phase5.${randomUUID()}@demo.investri.ri`,
    password: "DemoPass123!",
    firstName: "Pat",
    lastName: "Credit",
  });
  const user: RequestUser = { id: tokens.user.id, email: tokens.user.email, roles: tokens.user.roles };
  const onboarding = new OnboardingService(createProviders(config, new PrismaAuditSink()));
  await onboarding.submitIdentity(user, {
    legalFirstName: "Pat",
    legalLastName: "Credit",
    dateOfBirth: "1988-04-12",
    ssnLastFour: "6666",
  });
  await onboarding.submitResidency(user, {
    street: "12 Benefit Street",
    city: "Providence",
    state: "RI",
    postalCode: "02903",
    attestedRiResident: true,
  });
  await onboarding.submitProfile(user, {
    citizenship: "US",
    employmentStatus: "employed",
    experienceBand: "some",
    incomeRange: "50k-100k",
    netWorthRange: "50k-250k",
    canBearLoss: true,
    acceptsIlliquidity: true,
  });
  await onboarding.submitAcknowledgements(user, { keys: [...ONBOARDING_DISCLOSURE_KEYS] });
  return user;
}

describe("tax credit engine", () => {
  it("creates one pending entitlement on settle and updates the citizen view after certify", async () => {
    const user = await eligibleUser();
    const settled = await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
    });
    await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-retry-${settled.order.id}`,
    }).catch(() => undefined);
    const before = await engine.listForUser(user.id);
    expect(before).toHaveLength(1);
    expect(before[0].buckets.certified).toBe("0.0000");
    expect(before[0].buckets.estimated).toBe("200.0000");

    const reviewer: RequestUser = {
      id: (await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@commerce.ri.gov" } })).id,
      email: "reviewer@commerce.ri.gov",
      roles: [RoleName.COMMERCE_TAX_ADMIN],
    };
    await engine.certify(reviewer, before[0].id, {
      amount: "50.0000",
      reason: "POC certify",
      reasonCode: "DEMO_POC",
    });
    const after = await engine.getForUser(user.id, before[0].id);
    expect(after.buckets.certified).toBe("50.0000");
    expect(after.certificates[0].number).toMatch(/^RI-INV-/);

    const again = await engine.createOnSettle({
      userId: user.id,
      positionId: settled.position!.id,
      offeringId,
      amount: "1000",
      residencyPassed: true,
    });
    expect(again?.id).toBe(before[0].id);
  });

  it("rejects over-cap certification and fund manager certify", async () => {
    const user = await eligibleUser();
    await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
    });
    const [entitlement] = await engine.listForUser(user.id);
    const reviewer: RequestUser = {
      id: "reviewer",
      email: "reviewer@commerce.ri.gov",
      roles: [RoleName.COMMERCE_TAX_ADMIN],
    };
    await expect(
      engine.certify(reviewer, entitlement.id, {
        amount: "50000001.0000",
        reason: "too much",
        reasonCode: "OVER",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      engine.certify(
        { id: "mgr", email: "manager@demo.investri.ri", roles: [RoleName.FUND_MANAGER] },
        entitlement.id,
        { amount: "50.0000", reason: "no", reasonCode: "NO" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("records an adjustment and supersedes the prior certificate", async () => {
    const user = await eligibleUser();
    await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
    });
    const [entitlement] = await engine.listForUser(user.id);
    const reviewer: RequestUser = {
      id: (await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@commerce.ri.gov" } })).id,
      email: "reviewer@commerce.ri.gov",
      roles: [RoleName.COMMERCE_TAX_ADMIN],
    };
    await engine.certify(reviewer, entitlement.id, {
      amount: "50.0000",
      reason: "first certify",
      reasonCode: "FIRST",
    });
    await engine.adjust(reviewer, entitlement.id, {
      amount: "100.0000",
      reason: "basis correction",
      reasonCode: "ADJUST_BASIS",
    });
    const second = await engine.certify(reviewer, entitlement.id, {
      amount: "40.0000",
      reason: "supersede",
      reasonCode: "SUPERSEDE",
    });
    expect(second.certificate.supersedesCertificateId).toBeTruthy();
    const after = await engine.getForUser(user.id, entitlement.id);
    expect(after.buckets.certified).toBe("40.0000");
    const docs = await prisma.investorDocument.findMany({
      where: { userId: user.id, category: "RI_TAX_CREDIT_CERTIFICATE" },
    });
    expect(docs.length).toBeGreaterThan(0);
  });
});
