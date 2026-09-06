export const RoleName = {
  CITIZEN_INVESTOR: "CITIZEN_INVESTOR",
  COMMERCE_REVIEWER: "COMMERCE_REVIEWER",
  COMMERCE_PROGRAM_ADMIN: "COMMERCE_PROGRAM_ADMIN",
  COMMERCE_TAX_ADMIN: "COMMERCE_TAX_ADMIN",
  COMPLIANCE_OFFICER: "COMPLIANCE_OFFICER",
  FUND_MANAGER: "FUND_MANAGER",
  FUND_MANAGER_EDITOR: "FUND_MANAGER_EDITOR",
  AUDITOR_READ_ONLY: "AUDITOR_READ_ONLY",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const OfferingFramework = {
  REG_CF: "REG_CF",
  REG_A_TIER_1: "REG_A_TIER_1",
  REG_A_TIER_2: "REG_A_TIER_2",
  RULE_147: "RULE_147",
  RULE_147A: "RULE_147A",
  REGISTERED_FUND: "REGISTERED_FUND",
  MUNICIPAL_OR_QUASI_PUBLIC: "MUNICIPAL_OR_QUASI_PUBLIC",
  OTHER: "OTHER",
  DEMO: "DEMO",
} as const;

export type OfferingFramework =
  (typeof OfferingFramework)[keyof typeof OfferingFramework];

export const OfferingStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  COMMERCE_APPROVED: "COMMERCE_APPROVED",
  REGULATORY_APPROVED: "REGULATORY_APPROVED",
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  PAUSED: "PAUSED",
  CLOSED: "CLOSED",
  MATURED: "MATURED",
  ARCHIVED: "ARCHIVED",
} as const;

export type OfferingStatus = (typeof OfferingStatus)[keyof typeof OfferingStatus];

export const PublicOfferingStatus = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  CLOSED: "CLOSED",
} as const;

export type PublicOfferingStatus =
  (typeof PublicOfferingStatus)[keyof typeof PublicOfferingStatus];

export const DocumentAccessLevel = {
  PUBLIC: "PUBLIC",
  AUTHENTICATED: "AUTHENTICATED",
  ELIGIBLE_INVESTOR: "ELIGIBLE_INVESTOR",
} as const;

export type DocumentAccessLevel =
  (typeof DocumentAccessLevel)[keyof typeof DocumentAccessLevel];

export const TaxCreditProgramStatus = {
  PROPOSED: "PROPOSED",
  ENACTED: "ENACTED",
  ACTIVE: "ACTIVE",
  SUNSET: "SUNSET",
  SUSPENDED: "SUSPENDED",
} as const;

export type TaxCreditProgramStatus =
  (typeof TaxCreditProgramStatus)[keyof typeof TaxCreditProgramStatus];

export const VestingMethod = {
  IMMEDIATE: "IMMEDIATE",
  ANNUAL_EQUAL: "ANNUAL_EQUAL",
  CUSTOM_SCHEDULE: "CUSTOM_SCHEDULE",
  MILESTONE_BASED: "MILESTONE_BASED",
} as const;

export type VestingMethod = (typeof VestingMethod)[keyof typeof VestingMethod];

export const ProjectStatus = {
  PIPELINE: "PIPELINE",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  CLOSED: "CLOSED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VerificationStatus = {
  pending: "pending",
  passed: "passed",
  failed: "failed",
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const InvestmentOrderStatus = {
  QUOTED: "QUOTED",
  LIMIT_FAILED: "LIMIT_FAILED",
  AWAITING_FUNDING: "AWAITING_FUNDING",
  AWAITING_SIGNATURE: "AWAITING_SIGNATURE",
  SUBMITTED: "SUBMITTED",
  COMPLIANCE_REVIEW: "COMPLIANCE_REVIEW",
  FUNDING_PENDING: "FUNDING_PENDING",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
} as const;

export type InvestmentOrderStatus =
  (typeof InvestmentOrderStatus)[keyof typeof InvestmentOrderStatus];

export const CashFlowType = {
  CONTRIBUTION: "CONTRIBUTION",
  FEE: "FEE",
  DISTRIBUTION: "DISTRIBUTION",
} as const;

export type CashFlowType = (typeof CashFlowType)[keyof typeof CashFlowType];
