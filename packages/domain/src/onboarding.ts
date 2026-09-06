import { VerificationStatus } from "./enums";

export const OnboardingStatus = {
  NOT_STARTED: "NOT_STARTED",
  IDENTITY_REQUIRED: "IDENTITY_REQUIRED",
  IDENTITY_FAILED: "IDENTITY_FAILED",
  RESIDENCY_REQUIRED: "RESIDENCY_REQUIRED",
  RESIDENCY_FAILED: "RESIDENCY_FAILED",
  PROFILE_REQUIRED: "PROFILE_REQUIRED",
  ELIGIBILITY_REQUIRED: "ELIGIBILITY_REQUIRED",
  ELIGIBILITY_FAILED: "ELIGIBILITY_FAILED",
  ACKNOWLEDGEMENTS_REQUIRED: "ACKNOWLEDGEMENTS_REQUIRED",
  ELIGIBLE: "ELIGIBLE",
} as const;

export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const ONBOARDING_DISCLOSURE_KEYS = [
  "target-return-not-guaranteed",
  "proposed-tax-credit",
  "illiquidity",
  "loss-of-principal",
  "residency-attestation",
  "privacy",
  "electronic-delivery",
  "conflicts",
] as const;

export type OnboardingDisclosureKey = (typeof ONBOARDING_DISCLOSURE_KEYS)[number];

export const ONBOARDING_NEXT_STEP = {
  identity: "identity",
  residency: "residency",
  profile: "profile",
  acknowledgements: "acknowledgements",
  eligible: "eligible",
} as const;

export type OnboardingNextStep =
  (typeof ONBOARDING_NEXT_STEP)[keyof typeof ONBOARDING_NEXT_STEP];

export type OnboardingSnapshot = {
  identity: { status: VerificationStatus; lastErrorReason?: string | null } | null;
  residency: { status: VerificationStatus; lastErrorReason?: string | null } | null;
  profile: { exists: boolean } | null;
  eligibility: {
    status: VerificationStatus;
    suitable: boolean;
    residentQualified: boolean;
    reasonCode?: string | null;
  } | null;
  acknowledgedKeys: string[];
  requiredKeys?: readonly string[];
};

export type DerivedOnboarding = {
  status: OnboardingStatus;
  nextStep: OnboardingNextStep | null;
  blockers: string[];
  eligibleToInvest: boolean;
};

function derived(
  status: OnboardingStatus,
  nextStep: OnboardingNextStep | null,
  blockers: string[],
  eligibleToInvest: boolean,
): DerivedOnboarding {
  return { status, nextStep, blockers, eligibleToInvest };
}

export function deriveOnboardingStatus(snapshot: OnboardingSnapshot): DerivedOnboarding {
  const required = snapshot.requiredKeys ?? ONBOARDING_DISCLOSURE_KEYS;
  const accepted = new Set(snapshot.acknowledgedKeys);
  const acknowledgementsComplete = required.every((key) => accepted.has(key));

  if (!snapshot.identity) {
    return derived(OnboardingStatus.NOT_STARTED, ONBOARDING_NEXT_STEP.identity, [], false);
  }
  if (snapshot.identity.status === VerificationStatus.pending) {
    return derived(OnboardingStatus.IDENTITY_REQUIRED, ONBOARDING_NEXT_STEP.identity, [], false);
  }
  if (snapshot.identity.status === VerificationStatus.failed) {
    return derived(
      OnboardingStatus.IDENTITY_FAILED,
      ONBOARDING_NEXT_STEP.identity,
      [snapshot.identity.lastErrorReason ?? "Identity verification failed"],
      false,
    );
  }

  if (!snapshot.residency || snapshot.residency.status === VerificationStatus.pending) {
    return derived(OnboardingStatus.RESIDENCY_REQUIRED, ONBOARDING_NEXT_STEP.residency, [], false);
  }
  if (snapshot.residency.status === VerificationStatus.failed) {
    return derived(
      OnboardingStatus.RESIDENCY_FAILED,
      ONBOARDING_NEXT_STEP.residency,
      [snapshot.residency.lastErrorReason ?? "Rhode Island residency was not verified"],
      false,
    );
  }

  if (!snapshot.profile?.exists) {
    return derived(OnboardingStatus.PROFILE_REQUIRED, ONBOARDING_NEXT_STEP.profile, [], false);
  }

  if (!snapshot.eligibility || snapshot.eligibility.status === VerificationStatus.pending) {
    return derived(OnboardingStatus.ELIGIBILITY_REQUIRED, ONBOARDING_NEXT_STEP.profile, [], false);
  }
  if (snapshot.eligibility.status === VerificationStatus.failed || !snapshot.eligibility.suitable) {
    return derived(
      OnboardingStatus.ELIGIBILITY_FAILED,
      ONBOARDING_NEXT_STEP.profile,
      [
        snapshot.eligibility.reasonCode ??
          "You must attest that you can bear a loss of principal and accept illiquidity",
      ],
      false,
    );
  }

  if (!acknowledgementsComplete) {
    return derived(
      OnboardingStatus.ACKNOWLEDGEMENTS_REQUIRED,
      ONBOARDING_NEXT_STEP.acknowledgements,
      [],
      false,
    );
  }

  return derived(OnboardingStatus.ELIGIBLE, ONBOARDING_NEXT_STEP.eligible, [], true);
}

export function isFailedOnboardingStatus(status: OnboardingStatus): boolean {
  return (
    status === OnboardingStatus.IDENTITY_FAILED ||
    status === OnboardingStatus.RESIDENCY_FAILED ||
    status === OnboardingStatus.ELIGIBILITY_FAILED
  );
}
