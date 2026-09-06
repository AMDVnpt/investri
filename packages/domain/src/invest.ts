import { money, moneyString, type MoneyInput } from "./money";

export class QuoteRejectedError extends Error {
  constructor(
    public readonly code: "BELOW_MINIMUM" | "ABOVE_MAXIMUM" | "INVALID_AMOUNT",
    message: string,
  ) {
    super(message);
    this.name = "QuoteRejectedError";
  }
}

export type InvestmentQuote = {
  amount: string;
  feeAmount: string;
  cashTransferredToday: string;
  potentialCredit: string;
  netCashOutlayIllustrative: string;
  disclaimers: string[];
};

export function quoteInvestment(input: {
  amount: MoneyInput;
  minInvestment: MoneyInput;
  maxInvestment?: MoneyInput | null;
  creditRate: MoneyInput;
  feeAmount?: MoneyInput;
}): InvestmentQuote {
  const amount = money(input.amount);
  if (amount.lte(0)) {
    throw new QuoteRejectedError("INVALID_AMOUNT", "Amount must be greater than zero");
  }
  const min = money(input.minInvestment);
  if (amount.lt(min)) {
    throw new QuoteRejectedError("BELOW_MINIMUM", `Minimum investment is ${moneyString(min)}`);
  }
  if (input.maxInvestment != null) {
    const max = money(input.maxInvestment);
    if (amount.gt(max)) {
      throw new QuoteRejectedError("ABOVE_MAXIMUM", `Maximum investment is ${moneyString(max)}`);
    }
  }
  const feeAmount = money(input.feeAmount ?? "0");
  const potentialCredit = amount.mul(money(input.creditRate));
  return {
    amount: moneyString(amount),
    feeAmount: moneyString(feeAmount),
    cashTransferredToday: moneyString(amount),
    potentialCredit: moneyString(potentialCredit),
    netCashOutlayIllustrative: moneyString(amount),
    disclaimers: [
      "Target returns are not guaranteed. You can lose money.",
      "The tax credit is proposed and illustrative. It is not cash back and is not received until Commerce certifies it.",
      "Cash transferred today equals the investment amount.",
    ],
  };
}
