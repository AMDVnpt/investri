import { money, moneyString, type MoneyInput } from "./money";

export type PortfolioTotals = {
  totalContributions: string;
  totalDistributions: string;
  currentValue: string;
  unrealizedGainLoss: string;
  realizedGainLoss: string;
  totalReturn: string;
  totalReturnPercent: string;
};

export function portfolioTotals(input: {
  contributions: MoneyInput;
  distributions: MoneyInput;
  currentValue: MoneyInput;
  costBasis: MoneyInput;
}): PortfolioTotals {
  const contributions = money(input.contributions);
  const distributions = money(input.distributions);
  const currentValue = money(input.currentValue);
  const costBasis = money(input.costBasis);
  const unrealized = currentValue.sub(costBasis);
  const totalReturn = unrealized.add(distributions);
  return {
    totalContributions: moneyString(contributions),
    totalDistributions: moneyString(distributions),
    currentValue: moneyString(currentValue),
    unrealizedGainLoss: moneyString(unrealized),
    realizedGainLoss: moneyString(distributions),
    totalReturn: moneyString(totalReturn),
    totalReturnPercent: contributions.isZero() ? "0.0000" : totalReturn.div(contributions).toFixed(4),
  };
}

/** Simple XIRR on investment cash flows only. Tax credits are never included. */
export function simpleXirr(flows: { amount: MoneyInput; daysFromStart: number }[]): string | null {
  if (flows.length < 2) {
    return null;
  }
  let rate = money("0.08");
  for (let i = 0; i < 20; i += 1) {
    let npv = money("0");
    let dnpv = money("0");
    for (const flow of flows) {
      const t = money(flow.daysFromStart).div(365);
      const denom = money("1").add(rate).pow(t.toNumber());
      npv = npv.add(money(flow.amount).div(denom));
      dnpv = dnpv.sub(
        money(flow.amount).mul(t).div(money("1").add(rate).pow(t.add(1).toNumber())),
      );
    }
    if (dnpv.isZero()) {
      break;
    }
    rate = rate.sub(npv.div(dnpv));
  }
  return rate.toFixed(6);
}
