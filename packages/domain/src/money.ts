import { Decimal } from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export type MoneyInput = string | number | Decimal;

export function money(value: MoneyInput): Decimal {
  if (typeof value === "number") {
    throw new Error("Never construct money from a binary floating-point number");
  }
  return new Decimal(value);
}

export function moneyString(value: MoneyInput, scale = 4): string {
  return money(value).toFixed(scale);
}

export function rateString(value: MoneyInput, scale = 6): string {
  return money(value).toFixed(scale);
}

export function formatUsd(value: MoneyInput): string {
  const amount = money(value);
  const fixed = amount.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${withCommas}.${fraction}`;
}

export function formatPercentRange(low: MoneyInput | null, high: MoneyInput | null): string | null {
  if (low == null && high == null) {
    return null;
  }
  const toPct = (input: MoneyInput) =>
    `${money(input).mul(100).toDecimalPlaces(1).toString()}%`;
  if (low != null && high != null) {
    return `${toPct(low)}–${toPct(high)}`;
  }
  return toPct(low ?? high ?? "0");
}

export function fundingRatio(raised: MoneyInput, target: MoneyInput): Decimal {
  const targetAmount = money(target);
  if (targetAmount.isZero()) {
    return money("0");
  }
  return money(raised).div(targetAmount);
}

export function illustrateTaxCredit(qualifiedBasis: MoneyInput, creditRate: MoneyInput) {
  const basis = money(qualifiedBasis);
  const potential = basis.mul(money(creditRate));
  return {
    exampleInvestment: moneyString(basis),
    potentialCredit: moneyString(potential),
    cashTransferredToday: moneyString(basis),
    illustrative: true as const,
  };
}
