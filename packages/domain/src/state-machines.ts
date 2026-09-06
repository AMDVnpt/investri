import { OfferingStatus } from "./enums";

const OFFERING_TRANSITIONS: Record<OfferingStatus, OfferingStatus[]> = {
  DRAFT: [OfferingStatus.SUBMITTED],
  SUBMITTED: [OfferingStatus.UNDER_REVIEW, OfferingStatus.CHANGES_REQUESTED],
  UNDER_REVIEW: [
    OfferingStatus.COMMERCE_APPROVED,
    OfferingStatus.CHANGES_REQUESTED,
  ],
  CHANGES_REQUESTED: [OfferingStatus.SUBMITTED],
  COMMERCE_APPROVED: [OfferingStatus.REGULATORY_APPROVED],
  REGULATORY_APPROVED: [OfferingStatus.SCHEDULED, OfferingStatus.LIVE],
  SCHEDULED: [OfferingStatus.LIVE, OfferingStatus.PAUSED],
  LIVE: [OfferingStatus.PAUSED, OfferingStatus.CLOSED],
  PAUSED: [OfferingStatus.LIVE, OfferingStatus.CLOSED],
  CLOSED: [OfferingStatus.MATURED, OfferingStatus.ARCHIVED],
  MATURED: [OfferingStatus.ARCHIVED],
  ARCHIVED: [],
};

export function canTransitionOffering(
  from: OfferingStatus,
  to: OfferingStatus,
): boolean {
  return OFFERING_TRANSITIONS[from].includes(to);
}

export const PUBLIC_OFFERING_STATUSES: OfferingStatus[] = [
  OfferingStatus.SCHEDULED,
  OfferingStatus.LIVE,
  OfferingStatus.CLOSED,
];

/** Phase 2 implements through REVIEW_OFFERING_DOCUMENTS, then ELIGIBLE_TO_INVEST. ENTER_AMOUNT+ is Phase 3. */
export const INVESTMENT_FLOW = [
  "BROWSING",
  "ACCOUNT_REQUIRED",
  "IDENTITY_REQUIRED",
  "RESIDENCY_REQUIRED",
  "INVESTOR_PROFILE_REQUIRED",
  "ELIGIBILITY_CHECK",
  "REVIEW_OFFERING_DOCUMENTS",
  "ENTER_AMOUNT",
  "LIMIT_CHECK",
  "TAX_CREDIT_ESTIMATE",
  "FUNDING_SOURCE",
  "E_SIGNATURE",
  "SUBMITTED",
  "COMPLIANCE_REVIEW",
  "FUNDING_PENDING",
  "SETTLED",
  "TAX_CREDIT_PENDING",
  "TAX_CREDIT_CERTIFIED",
] as const;
