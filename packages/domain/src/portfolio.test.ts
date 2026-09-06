import { describe, expect, it } from "vitest";
import { portfolioTotals } from "./portfolio";

describe("portfolioTotals", () => {
  it("computes Alex seed math without folding in tax credits", () => {
    const totals = portfolioTotals({
      contributions: "1000",
      distributions: "20",
      currentValue: "1032",
      costBasis: "1000",
    });
    expect(totals.currentValue).toBe("1032.0000");
    expect(totals.totalContributions).toBe("1000.0000");
    expect(totals.totalDistributions).toBe("20.0000");
    expect(totals.unrealizedGainLoss).toBe("32.0000");
  });
});
