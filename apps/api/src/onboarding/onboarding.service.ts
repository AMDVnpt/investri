import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@investri/database";
import {
  ONBOARDING_DISCLOSURE_KEYS,
  RoleName,
  deriveOnboardingStatus,
  type DerivedOnboarding,
} from "@investri/domain";
import type { ProviderRegistry } from "@investri/providers";
import type {
  AcknowledgementsInput,
  IdentityInput,
  InvestorProfileInput,
  ResidencyInput,
} from "@investri/validation";
import { randomUUID } from "node:crypto";
import type { RequestUser } from "../common/current-user";
import { PROVIDERS } from "../providers/providers.token";

export type OnboardingStatusPayload = DerivedOnboarding & {
  requiredKeys: string[];
  acceptedKeys: string[];
  pendingKeys: string[];
};

@Injectable()
export class OnboardingService {
  constructor(@Inject(PROVIDERS) private readonly providers: ProviderRegistry) {}

  async getStatus(user: RequestUser): Promise<OnboardingStatusPayload> {
    this.assertCitizen(user);
    const snapshot = await this.loadSnapshot(user.id);
    const derived = deriveOnboardingStatus(snapshot);
    const acceptedKeys = snapshot.acknowledgedKeys;
    const requiredKeys = [...ONBOARDING_DISCLOSURE_KEYS];
    return {
      ...derived,
      requiredKeys,
      acceptedKeys,
      pendingKeys: requiredKeys.filter((key) => !acceptedKeys.includes(key)),
    };
  }

  async submitIdentity(user: RequestUser, input: IdentityInput): Promise<OnboardingStatusPayload> {
    this.assertCitizen(user);
    const applicant = await this.providers.kyc.createApplicant({
      userId: user.id,
      email: user.email,
      ssnLastFour: input.ssnLastFour,
    });
    const started = await this.providers.kyc.startVerification(applicant.applicantId);
    const verification = await this.providers.kyc.getVerificationStatus(applicant.applicantId);
    const status = verification.status;
    const lastErrorReason = status === "failed" ? (verification.reason ?? "Identity verification failed") : null;

    const record = await prisma.identityVerification.upsert({
      where: { userId: user.id },
      update: {
        applicantId: applicant.applicantId,
        providerToken: started.providerToken,
        ssnLastFour: input.ssnLastFour ?? null,
        legalFirstName: input.legalFirstName,
        legalLastName: input.legalLastName,
        dateOfBirth: dateOnly(input.dateOfBirth),
        phone: input.phone ?? null,
        status,
        lastErrorReason,
      },
      create: {
        userId: user.id,
        applicantId: applicant.applicantId,
        providerToken: started.providerToken,
        ssnLastFour: input.ssnLastFour ?? null,
        legalFirstName: input.legalFirstName,
        legalLastName: input.legalLastName,
        dateOfBirth: dateOnly(input.dateOfBirth),
        phone: input.phone ?? null,
        status,
        lastErrorReason,
      },
    });

    await this.audit(user, "identity.verified", "IdentityVerification", record.id, {
      status,
      applicantId: applicant.applicantId,
    });

    return this.getStatus(user);
  }

  async submitResidency(user: RequestUser, input: ResidencyInput): Promise<OnboardingStatusPayload> {
    this.assertCitizen(user);
    const result = await this.providers.residency.verifyResidence({
      userId: user.id,
      street: input.street,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      attestedRiResident: input.attestedRiResident,
    });
    const lastErrorReason =
      result.status === "failed" ? (result.reason ?? "Rhode Island residency was not verified") : null;

    const record = await prisma.residencyVerification.upsert({
      where: { userId: user.id },
      update: {
        street: input.street,
        city: input.city,
        state: input.state.trim().toUpperCase(),
        postalCode: input.postalCode,
        evidenceId: result.evidenceId,
        attestedRiResident: input.attestedRiResident,
        status: result.status,
        lastErrorReason,
      },
      create: {
        userId: user.id,
        street: input.street,
        city: input.city,
        state: input.state.trim().toUpperCase(),
        postalCode: input.postalCode,
        evidenceId: result.evidenceId,
        attestedRiResident: input.attestedRiResident,
        status: result.status,
        lastErrorReason,
      },
    });

    await this.audit(user, "residency.verified", "ResidencyVerification", record.id, {
      status: result.status,
      state: record.state,
      attestedRiResident: input.attestedRiResident,
    });

    return this.getStatus(user);
  }

  async submitProfile(user: RequestUser, input: InvestorProfileInput): Promise<OnboardingStatusPayload> {
    this.assertCitizen(user);
    const identity = await prisma.identityVerification.findUnique({ where: { userId: user.id } });
    const residency = await prisma.residencyVerification.findUnique({ where: { userId: user.id } });

    const legalFirstName = input.legalFirstName ?? identity?.legalFirstName;
    const legalLastName = input.legalLastName ?? identity?.legalLastName;
    const dateOfBirth = input.dateOfBirth ? dateOnly(input.dateOfBirth) : identity?.dateOfBirth;
    if (!legalFirstName || !legalLastName || !dateOfBirth) {
      return this.getStatus(user);
    }

    await prisma.investorProfile.upsert({
      where: { userId: user.id },
      update: {
        legalFirstName,
        legalLastName,
        dateOfBirth,
        phone: input.phone ?? identity?.phone ?? null,
        citizenship: input.citizenship,
        employmentStatus: input.employmentStatus,
        occupation: input.occupation ?? null,
        experienceBand: input.experienceBand,
        incomeRange: input.incomeRange,
        netWorthRange: input.netWorthRange,
        accredited: input.accredited ?? false,
        canBearLoss: input.canBearLoss,
        acceptsIlliquidity: input.acceptsIlliquidity,
        trustedContactName: input.trustedContactName ?? null,
        trustedContactPhone: input.trustedContactPhone ?? null,
      },
      create: {
        userId: user.id,
        legalFirstName,
        legalLastName,
        dateOfBirth,
        phone: input.phone ?? identity?.phone ?? null,
        citizenship: input.citizenship,
        employmentStatus: input.employmentStatus,
        occupation: input.occupation ?? null,
        experienceBand: input.experienceBand,
        incomeRange: input.incomeRange,
        netWorthRange: input.netWorthRange,
        accredited: input.accredited ?? false,
        canBearLoss: input.canBearLoss,
        acceptsIlliquidity: input.acceptsIlliquidity,
        trustedContactName: input.trustedContactName ?? null,
        trustedContactPhone: input.trustedContactPhone ?? null,
      },
    });

    const suitability = await this.providers.eligibility.verifySuitability({
      userId: user.id,
      canBearLoss: input.canBearLoss,
      acceptsIlliquidity: input.acceptsIlliquidity,
    });
    const accreditation = await this.providers.eligibility.verifyAccreditation(user.id);
    const residentQualified = residency?.status === "passed";
    const suitable = suitability.suitable && residentQualified;
    const status = suitable ? "passed" : "failed";
    const reasonCode = suitable
      ? null
      : (!residentQualified
          ? "Rhode Island residency was not verified"
          : (suitability.reason ?? "This offering is not suitable based on your profile"));

    const eligibility = await prisma.investorEligibility.upsert({
      where: { userId: user.id },
      update: {
        suitable,
        accredited: input.accredited ?? accreditation.accredited,
        residentQualified,
        status,
        reasonCode,
      },
      create: {
        userId: user.id,
        suitable,
        accredited: input.accredited ?? accreditation.accredited,
        residentQualified,
        status,
        reasonCode,
      },
    });

    await this.audit(user, "investor.eligibility_updated", "InvestorEligibility", eligibility.id, {
      status,
      suitable,
      accredited: eligibility.accredited,
      residentQualified,
      reasonCode,
    });

    return this.getStatus(user);
  }

  async submitAcknowledgements(
    user: RequestUser,
    input: AcknowledgementsInput,
  ): Promise<OnboardingStatusPayload> {
    this.assertCitizen(user);
    const scopeKey = input.offeringId ?? "global";
    if (input.offeringId) {
      const offering = await prisma.offering.findUnique({ where: { id: input.offeringId } });
      if (!offering) {
        throw new NotFoundException("Offering not found");
      }
    }

    for (const key of input.keys) {
      const template = await prisma.disclosureTemplate.findUnique({
        where: { key },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      const version = template?.versions[0];
      if (!template || !version) {
        throw new NotFoundException(`Disclosure not found: ${key}`);
      }
      await prisma.investorAcknowledgement.upsert({
        where: {
          userId_disclosureVersionId_scopeKey: {
            userId: user.id,
            disclosureVersionId: version.id,
            scopeKey,
          },
        },
        update: { acceptedAt: new Date(), offeringId: input.offeringId ?? null },
        create: {
          userId: user.id,
          disclosureVersionId: version.id,
          offeringId: input.offeringId ?? null,
          scopeKey,
        },
      });
      await this.audit(user, "investor.acknowledgement_recorded", "InvestorAcknowledgement", version.id, {
        disclosureKey: key,
        disclosureVersionId: version.id,
        version: version.version,
        scopeKey,
      });
    }

    return this.getStatus(user);
  }

  private async loadSnapshot(userId: string) {
    const [identity, residency, profile, eligibility, acknowledgements] = await Promise.all([
      prisma.identityVerification.findUnique({ where: { userId } }),
      prisma.residencyVerification.findUnique({ where: { userId } }),
      prisma.investorProfile.findUnique({ where: { userId } }),
      prisma.investorEligibility.findUnique({ where: { userId } }),
      prisma.investorAcknowledgement.findMany({
        where: { userId },
        include: { disclosureVersion: { include: { template: true } } },
      }),
    ]);

    return {
      identity: identity
        ? { status: identity.status, lastErrorReason: identity.lastErrorReason }
        : null,
      residency: residency
        ? { status: residency.status, lastErrorReason: residency.lastErrorReason }
        : null,
      profile: profile ? { exists: true } : null,
      eligibility: eligibility
        ? {
            status: eligibility.status,
            suitable: eligibility.suitable,
            residentQualified: eligibility.residentQualified,
            reasonCode: eligibility.reasonCode,
          }
        : null,
      acknowledgedKeys: acknowledgements.map((row) => row.disclosureVersion.template.key),
    };
  }

  private assertCitizen(user: RequestUser) {
    if (!user.roles.includes(RoleName.CITIZEN_INVESTOR)) {
      throw new ForbiddenException("Citizen investors only");
    }
  }

  private audit(
    user: RequestUser,
    action: string,
    entityType: string,
    entityId: string,
    afterJson: Record<string, unknown>,
  ) {
    return this.providers.audit.write({
      actorUserId: user.id,
      actorRole: user.roles[0],
      action,
      entityType,
      entityId,
      afterJson,
      correlationId: randomUUID(),
    });
  }
}

function dateOnly(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}
