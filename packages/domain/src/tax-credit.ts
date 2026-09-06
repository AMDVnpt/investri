import { money, moneyString, type MoneyInput } from "./money";

export const TaxCreditStatus = {
  estimated: "estimated",
  pending_investment_settlement: "pending_investment_settlement",
  pending_residency_verification: "pending_residency_verification",
  pending_commerce_review: "pending_commerce_review",
  certified: "certified",
  partially_available: "partially_available",
  fully_available: "fully_available",
  partially_claimed: "partially_claimed",
  fully_claimed: "fully_claimed",
  suspended: "suspended",
  recapture_review: "recapture_review",
  forfeited: "forfeited",
  recaptured: "recaptured",
} as const;

export type TaxCreditStatus = (typeof TaxCreditStatus)[keyof typeof TaxCreditStatus];

export const CapEntryType = {
  AUTHORIZED: "AUTHORIZED",
  RESERVED: "RESERVED",
  EARNED: "EARNED",
  CERTIFIED: "CERTIFIED",
  CLAIMED: "CLAIMED",
  RELEASED: "RELEASED",
  RECAPTURED: "RECAPTURED",
} as const;

export type CapEntryType = (typeof CapEntryType)[keyof typeof CapEntryType];

export type VestingSlice = { yearIndex: number; rate: MoneyInput; vestsOn?: string };

export type TaxCreditCalc = {
  potentialCredit: string;
  earnedCredit: string;
  certifiedCredit: string;
  currentlyAvailable: string;
  claimedCredit: string;
  remainingCredit: string;
  nextVestingDate: string | null;
};

export function calculateTaxCredit(input: {
  qualifiedBasis: MoneyInput;
  creditRate: MoneyInput;
  vestingSchedule: VestingSlice[];
  vestingMethod?: "IMMEDIATE" | "ANNUAL_EQUAL" | "CUSTOM_SCHEDULE" | "MILESTONE_BASED";
  holdingPeriodMonths?: number;
  minimumHoldingMonths?: number;
  certificationStatus: TaxCreditStatus | string;
  priorClaims?: MoneyInput;
  adjustments?: MoneyInput;
  remainingProgramCap?: MoneyInput;
  certifiedAmount?: MoneyInput;
  milestonePassed?: boolean;
}): TaxCreditCalc {
  const basis = money(input.qualifiedBasis);
  const potential = basis.mul(money(input.creditRate));
  const method = input.vestingMethod ?? "ANNUAL_EQUAL";
  let earned = money("0");
  let nextVestingDate: string | null = null;

  if (method === "IMMEDIATE") {
    earned = potential;
  } else if (method === "MILESTONE_BASED") {
    earned = input.milestonePassed ? potential : money("0");
  } else {
    const now = new Date();
    for (const slice of input.vestingSchedule) {
      const sliceAmount = potential.mul(money(slice.rate)).div(money(input.creditRate).isZero() ? money("1") : money("1"));
      const amount = basis.mul(money(slice.rate));
      if (slice.vestsOn) {
        const when = new Date(slice.vestsOn);
        if (when <= now) {
          earned = earned.add(amount);
        } else if (!nextVestingDate) {
          nextVestingDate = slice.vestsOn;
        }
      } else if (slice.yearIndex === 0) {
        earned = earned.add(amount);
      } else if (!nextVestingDate) {
        nextVestingDate = null;
      }
      void sliceAmount;
    }
  }

  const holdingBroken =
    input.minimumHoldingMonths != null &&
    input.holdingPeriodMonths != null &&
    input.holdingPeriodMonths < input.minimumHoldingMonths;
  if (holdingBroken && input.certificationStatus !== TaxCreditStatus.certified) {
    earned = money("0");
  }

  const certified = money(input.certifiedAmount ?? "0");
  const claimed = money(input.priorClaims ?? "0");
  const adjustments = money(input.adjustments ?? "0");
  const remainingCredit = potential.add(adjustments).sub(certified);
  const currentlyAvailable = certified.sub(claimed);
  if (claimed.gt(certified) || claimed.gt(currentlyAvailable.add(claimed))) {
    throw new Error("Claimed cannot exceed certified/available");
  }
  if (input.remainingProgramCap != null && certified.gt(money(input.remainingProgramCap))) {
    throw new CapExceededError("Certification would exceed the remaining program cap");
  }

  return {
    potentialCredit: moneyString(potential),
    earnedCredit: moneyString(earned),
    certifiedCredit: moneyString(certified),
    currentlyAvailable: moneyString(currentlyAvailable.lt(0) ? money("0") : currentlyAvailable),
    claimedCredit: moneyString(claimed),
    remainingCredit: moneyString(remainingCredit.lt(0) ? money("0") : remainingCredit),
    nextVestingDate,
  };
}

export class CapExceededError extends Error {
  constructor(message = "Program cap exceeded") {
    super(message);
    this.name = "CapExceededError";
  }
}

export function remainingCap(authorized: MoneyInput, consumed: MoneyInput) {
  const left = money(authorized).sub(money(consumed));
  return moneyString(left.lt(0) ? money("0") : left);
}

export function wouldExceedCap(remaining: MoneyInput, nextAmount: MoneyInput) {
  return money(nextAmount).gt(money(remaining));
}

export function carryforwardExpires(taxYear: number, carryforwardYears: number) {
  return taxYear + carryforwardYears;
}
