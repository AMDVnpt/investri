import type { OnboardingStatusResponse } from "./types";

export function firstSearchParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || undefined;
}

export function resolveOfferingId(params: {
  offeringId?: string | string[];
  offering?: string | string[];
}) {
  return firstSearchParam(params.offeringId) ?? firstSearchParam(params.offering);
}

export function offeringQuery(offeringId?: string) {
  return offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : "";
}

export function onboardingPath(offeringId?: string) {
  return `/onboarding${offeringQuery(offeringId)}`;
}

export function onboardingSignInHref(offeringId?: string) {
  return `/sign-in?returnTo=${encodeURIComponent(onboardingPath(offeringId))}`;
}

export function isEligibleStatus(status: OnboardingStatusResponse) {
  return status.eligibleToInvest || status.status === "ELIGIBLE" || status.nextStep === "eligible";
}

export function routeForOnboarding(status: OnboardingStatusResponse, offeringId?: string) {
  const q = offeringQuery(offeringId);
  if (isEligibleStatus(status)) {
    return offeringId ? `/invest/amount${q}` : `/onboarding/eligible`;
  }
  if (
    status.status === "IDENTITY_FAILED" ||
    status.status === "RESIDENCY_FAILED" ||
    status.status === "ELIGIBILITY_FAILED"
  ) {
    return `/onboarding/action-required${q}`;
  }
  switch (status.nextStep) {
    case "identity":
      return `/onboarding/identity${q}`;
    case "residency":
      return `/onboarding/residency${q}`;
    case "profile":
      return `/onboarding/profile${q}`;
    case "acknowledgements":
      return `/onboarding/acknowledgements${q}`;
    case "eligible":
      return `/onboarding/eligible${q}`;
    default:
      return `/onboarding${q}`;
  }
}

export const ONBOARDING_STEPS = ["Identity", "Residency", "Profile", "Disclosures", "Eligible"] as const;

export function stepIndex(status: string) {
  if (status === "NOT_STARTED" || status === "IDENTITY_REQUIRED" || status === "IDENTITY_FAILED") return 0;
  if (status === "RESIDENCY_REQUIRED" || status === "RESIDENCY_FAILED") return 1;
  if (status === "PROFILE_REQUIRED" || status === "ELIGIBILITY_REQUIRED" || status === "ELIGIBILITY_FAILED")
    return 2;
  if (status === "ACKNOWLEDGEMENTS_REQUIRED") return 3;
  return 4;
}
