import { moneyString } from "@investri/domain";

export const demoUsers = {
  citizen: {
    email: "alex.smith@demo.investri.ri",
    firstName: "Alex",
    lastName: "Smith",
  },
  reviewer: {
    email: "reviewer@commerce.ri.gov",
    firstName: "Jordan",
    lastName: "Costa",
  },
  admin: {
    email: "admin@investri.local",
    firstName: "Riley",
    lastName: "Admin",
  },
  manager: {
    email: "manager@demo.investri.ri",
    firstName: "Sam",
    lastName: "Okoro",
  },
} as const;

export const demoOffering = {
  slug: "investri-growth-fund-i",
  name: "InvestRI Growth Fund I",
  minInvestment: moneyString("100"),
  targetRaise: moneyString("25000000"),
  raisedAmount: moneyString("7425000"),
};
