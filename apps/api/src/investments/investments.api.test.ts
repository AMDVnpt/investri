import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { ForbiddenException, UnprocessableEntityException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@investri/database";
import { ONBOARDING_DISCLOSURE_KEYS } from "@investri/domain";
import { createProviders } from "@investri/providers";
import { loadConfig } from "@investri/config";
import { investmentQuoteSchema } from "@investri/validation";
import { randomUUID } from "node:crypto";
import { AuthService } from "../auth/auth.service";
import { OnboardingService } from "../onboarding/onboarding.service";
import { PrismaAuditSink } from "../providers/audit.sink";
import { InvestmentsService } from "./investments.service";
import type { RequestUser } from "../common/current-user";

const config = loadConfig();

let auth: AuthService;
let onboarding: OnboardingService;
let investments: InvestmentsService;
let offeringId: string;

beforeAll(async () => {
  const jwt = new JwtService({
    secret: config.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: config.JWT_ACCESS_TTL as `${number}m` },
  });
  auth = new AuthService(jwt);
  const providers = createProviders(config, new PrismaAuditSink());
  onboarding = new OnboardingService(providers);
  investments = new InvestmentsService(providers, onboarding);
  const offering = await prisma.offering.findUniqueOrThrow({
    where: { slug: "investri-growth-fund-i" },
  });
  offeringId = offering.id;
});

async function eligibleCitizen() {
  const email = `phase3.${randomUUID()}@demo.investri.ri`;
  const tokens = await auth.register({
    email,
    password: "DemoPass123!",
    firstName: "Pat",
    lastName: "Investor",
  });
  const user: RequestUser = {
    id: tokens.user.id,
    email: tokens.user.email,
    roles: tokens.user.roles,
  };
  await onboarding.submitIdentity(user, {
    legalFirstName: "Pat",
    legalLastName: "Investor",
    dateOfBirth: "1988-04-12",
    ssnLastFour: "4444",
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

describe("investments API", () => {
  it("quotes $100 and $1,000 and rejects $99", async () => {
    const user = await eligibleCitizen();
    const ok = await investments.quote(user, { offeringId, amount: "100" });
    expect(ok.amount).toBe("100.0000");
    await expect(investments.quote(user, { offeringId, amount: "99" })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    const thousand = await investments.quote(user, { offeringId, amount: "1000" });
    expect(thousand.potentialCredit).toBe("200.0000");
    expect(thousand.cashTransferredToday).toBe("1000.0000");
  });

  it("rejects a float amount at the schema boundary", () => {
    const parsed = investmentQuoteSchema.safeParse({ offeringId, amount: 1000 });
    expect(parsed.success).toBe(false);
  });

  it("settles once for a repeated idempotency key", async () => {
    const user = await eligibleCitizen();
    const key = `idem-${randomUUID()}`;
    const first = await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: key,
    });
    const second = await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: key,
    });
    expect(first.position?.id).toBe(second.position?.id);
    const positions = await prisma.investmentPosition.count({
      where: { investorAccountId: (await prisma.investorAccount.findUniqueOrThrow({ where: { userId: user.id } })).id },
    });
    expect(positions).toBe(1);
    const flows = await prisma.investmentCashFlow.count({
      where: { positionId: first.position!.id, type: "CONTRIBUTION" },
    });
    expect(flows).toBe(1);
    expect(first.taxCredit.status).toBe("pending_commerce_certification");
  });

  it("blocks a second open position on the same offering", async () => {
    const user = await eligibleCitizen();
    await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
    });
    await expect(
      investments.submit(user, {
        offeringId,
        amount: "1000",
        idempotencyKey: `idem-${randomUUID()}`,
      }),
    ).rejects.toThrow(/open position/);
  });

  it("forbids an ineligible citizen", async () => {
    const email = `phase3.no.${randomUUID()}@demo.investri.ri`;
    const tokens = await auth.register({
      email,
      password: "DemoPass123!",
      firstName: "Pat",
      lastName: "New",
    });
    await expect(
      investments.quote(
        { id: tokens.user.id, email: tokens.user.email, roles: tokens.user.roles },
        { offeringId, amount: "1000" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("does not persist bank credentials on the order or audit trail", async () => {
    const user = await eligibleCitizen();
    const result = await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
      bankLinkToken: "bank_demo_token",
    });
    const order = await prisma.investmentOrder.findUniqueOrThrow({ where: { id: result.order.id } });
    expect(JSON.stringify(order)).not.toMatch(/routing|accountNumber|password/i);
    const events = await prisma.auditEvent.findMany({ where: { actorUserId: user.id } });
    for (const event of events) {
      const serialized = JSON.stringify(event.afterJson ?? {});
      expect(serialized).not.toMatch(/routing|accountNumber|ssn/i);
    }
  });
});
