import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const offeringListQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(["LIVE", "SCHEDULED", "CLOSED"]).optional(),
  taxCreditEligible: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  residentOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  minInvestmentMax: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  municipality: z.string().optional(),
  impactCategory: z.string().optional(),
  riskLevel: z.string().optional(),
});

export const identitySchema = z.object({
  legalFirstName: z.string().min(1),
  legalLastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(7).optional(),
  ssnLastFour: z.string().regex(/^\d{4}$/).optional(),
});

export const residencySchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  postalCode: z.string().min(5).max(10),
  attestedRiResident: z.boolean(),
});

export const investorProfileSchema = z.object({
  citizenship: z.string().min(1),
  employmentStatus: z.string().min(1),
  occupation: z.string().optional(),
  experienceBand: z.string().min(1),
  incomeRange: z.string().min(1),
  netWorthRange: z.string().min(1),
  accredited: z.boolean().optional(),
  canBearLoss: z.boolean(),
  acceptsIlliquidity: z.boolean(),
  trustedContactName: z.string().optional(),
  trustedContactPhone: z.string().optional(),
  legalFirstName: z.string().min(1).optional(),
  legalLastName: z.string().min(1).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().optional(),
});

export const acknowledgementsSchema = z.object({
  keys: z.array(z.string().min(1)).min(1),
  offeringId: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OfferingListQuery = z.infer<typeof offeringListQuerySchema>;
export type IdentityInput = z.infer<typeof identitySchema>;
export type ResidencyInput = z.infer<typeof residencySchema>;
export type InvestorProfileInput = z.infer<typeof investorProfileSchema>;
export const decimalAmountSchema = z
  .string({ invalid_type_error: "Amount must be a decimal string" })
  .regex(/^\d+(\.\d{1,4})?$/, "Amount must be a decimal string");

export const investmentQuoteSchema = z.object({
  offeringId: z.string().uuid(),
  amount: decimalAmountSchema,
});

export const investmentSubmitSchema = z.object({
  offeringId: z.string().uuid(),
  amount: decimalAmountSchema,
  idempotencyKey: z.string().min(8),
  bankLinkToken: z.string().optional(),
});

export const plaidExchangeSchema = z.object({
  publicToken: z.string().min(8),
  institutionId: z.string().min(1).optional(),
});

export type PlaidExchangeInput = z.infer<typeof plaidExchangeSchema>;

export const taxCreditReasonSchema = z.object({
  reason: z.string().min(1),
  reasonCode: z.string().min(1),
  amount: decimalAmountSchema.optional(),
});

export const taxCreditAdjustSchema = taxCreditReasonSchema.extend({
  amount: z.string().regex(/^-?\d+(\.\d{1,4})?$/),
});

export type AcknowledgementsInput = z.infer<typeof acknowledgementsSchema>;
export type InvestmentQuoteInput = z.infer<typeof investmentQuoteSchema>;
export type InvestmentSubmitInput = z.infer<typeof investmentSubmitSchema>;
export const offeringActionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  reasonCode: z.string().min(1, "Reason code is required"),
});

export const recaptureReviewSchema = offeringActionSchema;

export type TaxCreditReasonInput = z.infer<typeof taxCreditReasonSchema>;
export type TaxCreditAdjustInput = z.infer<typeof taxCreditAdjustSchema>;
export const impactSubmitSchema = z.object({
  definitionKey: z.string().min(1),
  value: decimalAmountSchema,
  source: z.string().min(1),
  period: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
});

export type OfferingActionInput = z.infer<typeof offeringActionSchema>;
export type ImpactSubmitInput = z.infer<typeof impactSubmitSchema>;
