import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@investri/database";
import { ONBOARDING_DISCLOSURE_KEYS, RoleName } from "@investri/domain";
import { createProviders } from "@investri/providers";
import { loadConfig } from "@investri/config";
import { randomUUID } from "node:crypto";
import { AuthService } from "../auth/auth.service";
import { PrismaAuditSink } from "../providers/audit.sink";
import { OnboardingService } from "./onboarding.service";
import type { RequestUser } from "../common/current-user";

const config = loadConfig();

let auth: AuthService;
let onboarding: OnboardingService;

beforeAll(() => {
  const jwt = new JwtService({
    secret: config.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: config.JWT_ACCESS_TTL as `${number}m` },
  });
  auth = new AuthService(jwt);
  onboarding = new OnboardingService(createProviders(config, new PrismaAuditSink()));
});

async function registerCitizen() {
  const email = `phase2.${randomUUID()}@demo.investri.ri`;
  const tokens = await auth.register({
    email,
    password: "DemoPass123!",
    firstName: "Pat",
    lastName: "Citizen",
  });
  const user: RequestUser = {
    id: tokens.user.id,
    email: tokens.user.email,
    roles: tokens.user.roles,
  };
  return { email, user };
}

describe("onboarding API", () => {
  it("walks a citizen from register to eligibleToInvest", async () => {
    const { user } = await registerCitizen();

    const me = await auth.getUser(user.id);
    expect(me.eligibleToInvest).toBe(false);
    expect(me.onboardingStatus).toBe("NOT_STARTED");

    const identity = await onboarding.submitIdentity(user, {
      legalFirstName: "Pat",
      legalLastName: "Citizen",
      dateOfBirth: "1988-04-12",
      phone: "401-555-0101",
      ssnLastFour: "4321",
    });
    expect(identity.status).toBe("RESIDENCY_REQUIRED");

    const residency = await onboarding.submitResidency(user, {
      street: "10 Westminster St",
      city: "Providence",
      state: "RI",
      postalCode: "02903",
      attestedRiResident: true,
    });
    expect(residency.status).toBe("PROFILE_REQUIRED");

    const profile = await onboarding.submitProfile(user, {
      citizenship: "US",
      employmentStatus: "employed",
      experienceBand: "some",
      incomeRange: "50k-100k",
      netWorthRange: "50k-250k",
      canBearLoss: true,
      acceptsIlliquidity: true,
      trustedContactName: "Jamie Citizen",
      trustedContactPhone: "401-555-0102",
    });
    expect(profile.status).toBe("ACKNOWLEDGEMENTS_REQUIRED");

    const acks = await onboarding.submitAcknowledgements(user, {
      keys: [...ONBOARDING_DISCLOSURE_KEYS],
    });
    expect(acks.eligibleToInvest).toBe(true);
    expect(acks.status).toBe("ELIGIBLE");

    const stored = await prisma.investorAcknowledgement.findMany({
      where: { userId: user.id },
      include: { disclosureVersion: { include: { template: true } } },
    });
    expect(stored.length).toBeGreaterThanOrEqual(ONBOARDING_DISCLOSURE_KEYS.length);
    expect(stored.every((row) => row.disclosureVersionId)).toBe(true);

    const events = await prisma.auditEvent.findMany({ where: { actorUserId: user.id } });
    for (const event of events) {
      const serialized = JSON.stringify(event.afterJson ?? {});
      expect(serialized.toLowerCase()).not.toContain("ssn");
      expect(serialized).not.toContain("ssnLastFour");
    }
  });

  it("leaves a Massachusetts address in RESIDENCY_FAILED", async () => {
    const { user } = await registerCitizen();
    await onboarding.submitIdentity(user, {
      legalFirstName: "Pat",
      legalLastName: "OutOfState",
      dateOfBirth: "1988-04-12",
      ssnLastFour: "2222",
    });
    const residency = await onboarding.submitResidency(user, {
      street: "1 Main St",
      city: "Boston",
      state: "MA",
      postalCode: "02101",
      attestedRiResident: true,
    });
    expect(residency.status).toBe("RESIDENCY_FAILED");
    expect(residency.eligibleToInvest).toBe(false);
    expect(residency.blockers.join(" ")).toMatch(/Rhode Island residency/);
  });

  it("fails KYC for last-four 0000 without writing SSN to audit", async () => {
    const { user } = await registerCitizen();
    const identity = await onboarding.submitIdentity(user, {
      legalFirstName: "Pat",
      legalLastName: "Fail",
      dateOfBirth: "1988-04-12",
      ssnLastFour: "0000",
    });
    expect(identity.status).toBe("IDENTITY_FAILED");
    expect(identity.eligibleToInvest).toBe(false);

    const events = await prisma.auditEvent.findMany({
      where: { actorUserId: user.id, action: "identity.verified" },
    });
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      const serialized = JSON.stringify(event.afterJson ?? {});
      expect(serialized).not.toContain("ssnLastFour");
      expect(serialized).not.toContain("0000");
    }
  });

  it("returns ELIGIBILITY_FAILED when the investor does not attest to loss or illiquidity", async () => {
    const { user } = await registerCitizen();
    await onboarding.submitIdentity(user, {
      legalFirstName: "Pat",
      legalLastName: "Unsuitable",
      dateOfBirth: "1988-04-12",
      ssnLastFour: "3333",
    });
    await onboarding.submitResidency(user, {
      street: "12 Benefit Street",
      city: "Providence",
      state: "RI",
      postalCode: "02903",
      attestedRiResident: true,
    });
    const profile = await onboarding.submitProfile(user, {
      citizenship: "US",
      employmentStatus: "employed",
      experienceBand: "none",
      incomeRange: "under-50k",
      netWorthRange: "under-50k",
      canBearLoss: false,
      acceptsIlliquidity: false,
    });
    expect(profile.status).toBe("ELIGIBILITY_FAILED");
    expect(profile.eligibleToInvest).toBe(false);
  });

  it("forbids fund managers from citizen onboarding routes", async () => {
    const manager = await prisma.user.findUniqueOrThrow({
      where: { email: "manager@demo.investri.ri" },
    });
    await expect(
      onboarding.getStatus({
        id: manager.id,
        email: "manager@demo.investri.ri",
        roles: [RoleName.FUND_MANAGER],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
