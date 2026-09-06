import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@investri/database";
import { ONBOARDING_DISCLOSURE_KEYS } from "@investri/domain";
import { createProviders } from "@investri/providers";
import { loadConfig } from "@investri/config";
import { randomUUID } from "node:crypto";
import { AuthService } from "../auth/auth.service";
import { OnboardingService } from "../onboarding/onboarding.service";
import { InvestmentsService } from "../investments/investments.service";
import { PrismaAuditSink } from "../providers/audit.sink";
import { PortfolioService } from "./portfolio.service";
import type { RequestUser } from "../common/current-user";

const config = loadConfig();
let auth: AuthService;
let onboarding: OnboardingService;
let investments: InvestmentsService;
let portfolio: PortfolioService;
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
  portfolio = new PortfolioService();
  offeringId = (await prisma.offering.findUniqueOrThrow({ where: { slug: "investri-growth-fund-i" } })).id;
});

describe("portfolio API", () => {
  it("renders Alex seed totals without tax credits in the value series", async () => {
    const alex = await prisma.user.findUniqueOrThrow({
      where: { email: "alex.smith@demo.investri.ri" },
    });
    const user: RequestUser = {
      id: alex.id,
      email: alex.email,
      roles: ["CITIZEN_INVESTOR"],
    };
    const summary = await portfolio.summary(user);
    expect(summary.totals.currentValue).toBe("1032.0000");
    expect(summary.totals.totalContributions).toBe("1000.0000");
    expect(summary.totals.totalDistributions).toBe("20.0000");
    expect(summary.totals.unrealizedGainLoss).toBe("32.0000");
    expect(summary.valueSeries.every((point) => point.kind === "value")).toBe(true);
    expect(summary.taxCredit.proposed).toBe(true);
    expect(summary.taxCredit.buckets.certified).toBe("50.0000");
    expect(summary.taxCredit.buckets.estimated).toBe("200.0000");
    const docs = await portfolio.documents(user, { category: "STATEMENT", taxYear: "2025" });
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((doc) => doc.category === "STATEMENT")).toBe(true);
  });

  it("includes a newly settled Phase 3 position immediately", async () => {
    const email = `phase4.${randomUUID()}@demo.investri.ri`;
    const tokens = await auth.register({
      email,
      password: "DemoPass123!",
      firstName: "Pat",
      lastName: "Holder",
    });
    const user: RequestUser = {
      id: tokens.user.id,
      email: tokens.user.email,
      roles: tokens.user.roles,
    };
    await onboarding.submitIdentity(user, {
      legalFirstName: "Pat",
      legalLastName: "Holder",
      dateOfBirth: "1988-04-12",
      ssnLastFour: "5555",
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
    const settled = await investments.submit(user, {
      offeringId,
      amount: "1000",
      idempotencyKey: `idem-${randomUUID()}`,
    });
    const summary = await portfolio.summary(user);
    expect(summary.positions.some((row) => row.id === settled.position?.id)).toBe(true);
    expect(summary.totals.totalContributions).toBe("1000.0000");
  });
});
