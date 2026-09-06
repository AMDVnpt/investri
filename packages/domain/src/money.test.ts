import { describe, expect, it } from "vitest";
import {
  formatPercentRange,
  formatUsd,
  fundingRatio,
  illustrateTaxCredit,
  money,
  moneyString,
} from "./money";

describe("money", () => {
  it("rejects binary floating-point constructors", () => {
    expect(() => money(0.1)).toThrow(/floating-point/);
  });

  it("formats USD from decimal strings", () => {
    expect(formatUsd("1000.0000")).toBe("$1,000.00");
    expect(formatUsd("7425000")).toBe("$7,425,000.00");
  });

  it("formats a target-return range without implying a guarantee", () => {
    expect(formatPercentRange("0.07", "0.10")).toBe("7%–10%");
  });

  it("computes funding ratio with decimals", () => {
    expect(fundingRatio("7425000", "25000000").toFixed(4)).toBe("0.2970");
  });

  it("illustrates a proposed tax credit separately from cash transferred", () => {
    const illustration = illustrateTaxCredit("1000", "0.20");
    expect(illustration.potentialCredit).toBe("200.0000");
    expect(illustration.cashTransferredToday).toBe("1000.0000");
    expect(illustration.illustrative).toBe(true);
  });

  it("serializes money as a fixed-scale string", () => {
    expect(moneyString("100")).toBe("100.0000");
  });
});
