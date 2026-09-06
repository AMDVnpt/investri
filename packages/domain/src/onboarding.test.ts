import { describe, expect, it } from "vitest";
import { VerificationStatus } from "./enums";
import {
  ONBOARDING_DISCLOSURE_KEYS,
  OnboardingStatus,
  deriveOnboardingStatus,
} from "./onboarding";

const allAcks = [...ONBOARDING_DISCLOSURE_KEYS];

const passedIdentity = { status: VerificationStatus.passed };
const passedResidency = { status: VerificationStatus.passed };
const profile = { exists: true };
const passedEligibility = {
  status: VerificationStatus.passed,
  suitable: true,
  residentQualified: true,
};

describe("deriveOnboardingStatus", () => {
  it("starts at NOT_STARTED with identity as the next step", () => {
    const result = deriveOnboardingStatus({
      identity: null,
      residency: null,
      profile: null,
      eligibility: null,
      acknowledgedKeys: [],
    });
    expect(result).toEqual({
      status: OnboardingStatus.NOT_STARTED,
      nextStep: "identity",
      blockers: [],
      eligibleToInvest: false,
    });
  });

  it("returns IDENTITY_FAILED when KYC failed", () => {
    const result = deriveOnboardingStatus({
      identity: { status: VerificationStatus.failed, lastErrorReason: "Identity verification failed" },
      residency: null,
      profile: null,
      eligibility: null,
      acknowledgedKeys: [],
    });
    expect(result.status).toBe(OnboardingStatus.IDENTITY_FAILED);
    expect(result.eligibleToInvest).toBe(false);
    expect(result.blockers[0]).toMatch(/Identity/);
  });

  it("returns RESIDENCY_FAILED when the address is not RI", () => {
    const result = deriveOnboardingStatus({
      identity: passedIdentity,
      residency: {
        status: VerificationStatus.failed,
        lastErrorReason: "Rhode Island residency was not verified",
      },
      profile: null,
      eligibility: null,
      acknowledgedKeys: [],
    });
    expect(result.status).toBe(OnboardingStatus.RESIDENCY_FAILED);
    expect(result.nextStep).toBe("residency");
    expect(result.eligibleToInvest).toBe(false);
  });

  it("returns PROFILE_REQUIRED after residency passes", () => {
    const result = deriveOnboardingStatus({
      identity: passedIdentity,
      residency: passedResidency,
      profile: null,
      eligibility: null,
      acknowledgedKeys: [],
    });
    expect(result.status).toBe(OnboardingStatus.PROFILE_REQUIRED);
    expect(result.nextStep).toBe("profile");
  });

  it("returns ELIGIBILITY_FAILED when suitability is not attested", () => {
    const result = deriveOnboardingStatus({
      identity: passedIdentity,
      residency: passedResidency,
      profile,
      eligibility: {
        status: VerificationStatus.failed,
        suitable: false,
        residentQualified: true,
        reasonCode: "You must attest that you can bear a loss of principal and accept illiquidity",
      },
      acknowledgedKeys: [],
    });
    expect(result.status).toBe(OnboardingStatus.ELIGIBILITY_FAILED);
    expect(result.eligibleToInvest).toBe(false);
  });

  it("returns ACKNOWLEDGEMENTS_REQUIRED until every required version is accepted", () => {
    const result = deriveOnboardingStatus({
      identity: passedIdentity,
      residency: passedResidency,
      profile,
      eligibility: passedEligibility,
      acknowledgedKeys: ["illiquidity"],
    });
    expect(result.status).toBe(OnboardingStatus.ACKNOWLEDGEMENTS_REQUIRED);
    expect(result.eligibleToInvest).toBe(false);
  });

  it("returns ELIGIBLE on the happy path", () => {
    const result = deriveOnboardingStatus({
      identity: passedIdentity,
      residency: passedResidency,
      profile,
      eligibility: passedEligibility,
      acknowledgedKeys: allAcks,
    });
    expect(result).toEqual({
      status: OnboardingStatus.ELIGIBLE,
      nextStep: "eligible",
      blockers: [],
      eligibleToInvest: true,
    });
  });
});
