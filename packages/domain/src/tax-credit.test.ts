import { describe, expect, it } from "vitest";
import {
  CapExceededError,
  calculateTaxCredit,
  carryforwardExpires,
  remainingCap,
  wouldExceedCap,
} from "./tax-credit";

const annual = [
  { yearIndex: 0, rate: "0.05", vestsOn: "2025-01-01" },
  { yearIndex: 1, rate: "0.05", vestsOn: "2026-01-01" },
  { yearIndex: 2, rate: "0.05", vestsOn: "2027-01-01" },
  { yearIndex: 3, rate: "0.05", vestsOn: "2028-01-01" },
];

describe("calculateTaxCredit", () => {
  it("computes $200 potential and $50 year-0 certify on $1,000", () => {
    const result = calculateTaxCredit({
      qualifiedBasis: "1000",
      creditRate: "0.20",
      vestingSchedule: annual,
      vestingMethod: "ANNUAL_EQUAL",
      certificationStatus: "certified",
      certifiedAmount: "50",
    });
    expect(result.potentialCredit).toBe("200.0000");
    expect(result.certifiedCredit).toBe("50.0000");
    expect(result.earnedCredit).toBe("100.0000");
    expect(result.remainingCredit).toBe("150.0000");
  });

  it("releases unearned credit when the holding period is broken before certify", () => {
    const result = calculateTaxCredit({
      qualifiedBasis: "1000",
      creditRate: "0.20",
      vestingSchedule: annual,
      holdingPeriodMonths: 12,
      minimumHoldingMonths: 48,
      certificationStatus: "pending_commerce_review",
    });
    expect(result.earnedCredit).toBe("0.0000");
  });

  it("rejects claimed above certified", () => {
    expect(() =>
      calculateTaxCredit({
        qualifiedBasis: "1000",
        creditRate: "0.20",
        vestingSchedule: annual,
        certificationStatus: "certified",
        certifiedAmount: "50",
        priorClaims: "60",
      }),
    ).toThrow(/exceed/);
  });

  it("rejects certify over remaining cap", () => {
    expect(() =>
      calculateTaxCredit({
        qualifiedBasis: "1000",
        creditRate: "0.20",
        vestingSchedule: annual,
        certificationStatus: "certified",
        certifiedAmount: "50",
        remainingProgramCap: "40",
      }),
    ).toThrow(CapExceededError);
  });

  it("keeps milestone-based earned at 0 until a milestone is passed", () => {
    const pending = calculateTaxCredit({
      qualifiedBasis: "1000",
      creditRate: "0.20",
      vestingSchedule: [],
      vestingMethod: "MILESTONE_BASED",
      certificationStatus: "estimated",
    });
    const passed = calculateTaxCredit({
      qualifiedBasis: "1000",
      creditRate: "0.20",
      vestingSchedule: [],
      vestingMethod: "MILESTONE_BASED",
      certificationStatus: "estimated",
      milestonePassed: true,
    });
    expect(pending.earnedCredit).toBe("0.0000");
    expect(passed.earnedCredit).toBe("200.0000");
  });
});

describe("cap ledger helpers", () => {
  it("computes remaining cap and over-cap checks", () => {
    expect(remainingCap("50000000", "50")).toBe("49999950.0000");
    expect(wouldExceedCap("40", "50")).toBe(true);
    expect(wouldExceedCap("50", "50")).toBe(false);
  });

  it("sets carryforward expiration as taxYear + years", () => {
    expect(carryforwardExpires(2026, 5)).toBe(2031);
  });
});
