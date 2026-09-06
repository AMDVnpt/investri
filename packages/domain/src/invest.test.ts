import { describe, expect, it } from "vitest";
import { money } from "./money";
import { QuoteRejectedError, quoteInvestment } from "./invest";

describe("quoteInvestment", () => {
  it("accepts the $100 minimum", () => {
    const quote = quoteInvestment({
      amount: "100",
      minInvestment: "100",
      creditRate: "0.20",
    });
    expect(quote.amount).toBe("100.0000");
    expect(quote.cashTransferredToday).toBe("100.0000");
  });

  it("rejects $99", () => {
    expect(() =>
      quoteInvestment({ amount: "99", minInvestment: "100", creditRate: "0.20" }),
    ).toThrow(QuoteRejectedError);
  });

  it("illustrates $200 credit on $1,000 without mixing it into cash", () => {
    const quote = quoteInvestment({
      amount: "1000",
      minInvestment: "100",
      creditRate: "0.20",
    });
    expect(quote.potentialCredit).toBe("200.0000");
    expect(quote.cashTransferredToday).toBe("1000.0000");
    expect(quote.netCashOutlayIllustrative).toBe("1000.0000");
  });

  it("rejects a floating-point amount constructor", () => {
    expect(() => money(1000)).toThrow(/floating-point/);
  });
});
