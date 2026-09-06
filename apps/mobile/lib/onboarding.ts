import type { OnboardingStatusResponse } from "./types";

export function offeringQuery(offeringId?: string) {
  return offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : "";
}

export function routeForOnboarding(status: OnboardingStatusResponse, offeringId?: string) {
  const q = offeringQuery(offeringId);
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
