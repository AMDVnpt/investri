import { DocumentAccessLevel } from "@investri/domain";

export type DiligenceDocument = {
  id: string;
  title: string;
  category: string;
  accessLevel: (typeof DocumentAccessLevel)[keyof typeof DocumentAccessLevel];
  url: string;
  sortOrder: number;
};

export const DEMO_DILIGENCE_DOCUMENTS: DiligenceDocument[] = [
  {
    id: "demo-ppm",
    title: "Private placement memorandum (illustrative)",
    category: "PPM",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-ppm.txt",
    sortOrder: 0,
  },
  {
    id: "demo-offering-memo",
    title: "Offering memorandum (illustrative)",
    category: "Offering",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-offering-memorandum.txt",
    sortOrder: 1,
  },
  {
    id: "demo-fact-sheet",
    title: "Investor fact sheet",
    category: "FactSheet",
    accessLevel: DocumentAccessLevel.PUBLIC,
    url: "/assets/documents/growth-fund-fact-sheet.txt",
    sortOrder: 2,
  },
  {
    id: "demo-subscription",
    title: "Subscription agreement (illustrative)",
    category: "Subscription",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-subscription.txt",
    sortOrder: 3,
  },
  {
    id: "demo-risk-factors",
    title: "Risk factors",
    category: "Risk",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-risk-factors.txt",
    sortOrder: 4,
  },
  {
    id: "demo-disclosures",
    title: "Offering disclosures",
    category: "Disclosure",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-disclosures.txt",
    sortOrder: 5,
  },
  {
    id: "demo-tax-disclosure",
    title: "Tax disclosure",
    category: "Tax",
    accessLevel: DocumentAccessLevel.PUBLIC,
    url: "/assets/documents/growth-fund-tax-disclosure.txt",
    sortOrder: 6,
  },
  {
    id: "demo-diligence-overview",
    title: "Due diligence overview (illustrative)",
    category: "Diligence",
    accessLevel: DocumentAccessLevel.PUBLIC,
    url: "/assets/documents/growth-fund-diligence-overview.pdf",
    sortOrder: 10,
  },
  {
    id: "demo-diligence-memo",
    title: "Due diligence memorandum (illustrative)",
    category: "Diligence",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-diligence-memo.pdf",
    sortOrder: 11,
  },
  {
    id: "demo-diligence-financials",
    title: "Financial summary (illustrative)",
    category: "Diligence",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-financials.pdf",
    sortOrder: 12,
  },
  {
    id: "demo-diligence-manager",
    title: "Manager background (illustrative)",
    category: "Diligence",
    accessLevel: DocumentAccessLevel.AUTHENTICATED,
    url: "/assets/documents/growth-fund-manager-background.pdf",
    sortOrder: 13,
  },
];

export function withDiligenceDocuments<T extends { category: string; accessLevel: string; sortOrder?: number }>(
  documents: T[],
  authenticated: boolean,
  canRead: (level: string, auth: boolean) => boolean,
): Array<T | DiligenceDocument> {
  const visible = documents.filter((doc) => canRead(doc.accessLevel, authenticated));
  const present = new Set(visible.map((doc) => doc.category.toLowerCase()));
  const extras = DEMO_DILIGENCE_DOCUMENTS.filter(
    (doc) => canRead(doc.accessLevel, authenticated) && !present.has(doc.category.toLowerCase()),
  );
  return [...visible, ...extras].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export const DOCUMENT_FALLBACK_BODIES: Record<string, string> = {
  "/assets/documents/growth-fund-ppm.txt":
    "InvestRI Growth Fund I — Private Placement Memorandum (ILLUSTRATIVE / FICTIONAL)\n\nThis PPM is a demonstration placeholder. It is not an offering of securities.\nTarget returns, allocations, and tax-credit terms are seed data only.",
  "/assets/documents/growth-fund-offering-memorandum.txt":
    "InvestRI Growth Fund I — Offering Memorandum (ILLUSTRATIVE / FICTIONAL)\n\nThis document is a demonstration placeholder. It is not an offering of securities.\nNo real subscription can be accepted through this proof of concept.",
  "/assets/documents/growth-fund-fact-sheet.txt":
    "InvestRI Growth Fund I — Investor Fact Sheet (ILLUSTRATIVE)\n\nMinimum $100. Target return 7%–10% (not guaranteed). Distributions annual.\nTax credits are shown separately and are not included in performance.",
  "/assets/documents/growth-fund-subscription.txt":
    "InvestRI Growth Fund I — Subscription Agreement (ILLUSTRATIVE / FICTIONAL)\n\nThis is not a legally binding subscription. Do not send money.",
  "/assets/documents/growth-fund-risk-factors.txt":
    "InvestRI Growth Fund I — Risk Factors (ILLUSTRATIVE)\n\nYou can lose some or all of your principal. The investment is illiquid.\nTarget returns are not guaranteed. The proposed tax credit is not return.",
  "/assets/documents/growth-fund-disclosures.txt":
    "InvestRI Growth Fund I — Offering Disclosures (ILLUSTRATIVE)\n\nBank linking uses Plaid. InvestRI stores a token only — never a routing or account number.\nThe proposed Rhode Island tax credit is not investment return and is not cash.",
  "/assets/documents/growth-fund-tax-disclosure.txt":
    "InvestRI Growth Fund I — Tax Disclosure (ILLUSTRATIVE)\n\nAny Rhode Island tax incentive shown is a proposed program configuration.\nNever treat a tax credit as cash back or as part of investment performance.",
  "/assets/documents/growth-fund-diligence-overview.pdf":
    "InvestRI Growth Fund I — Due Diligence Overview (ILLUSTRATIVE)\n\nThis overview summarizes the demonstration diligence pack: memorandum, financial summary, and manager background.\nTarget returns and tax-credit terms are seed data only.",
  "/assets/documents/growth-fund-diligence-memo.pdf":
    "InvestRI Growth Fund I — Diligence Memorandum (ILLUSTRATIVE)\n\nStrategy: diversified Rhode Island private-market allocations.\nReview items: manager process, liquidity, fees, and conflicts.\nThe proposed RI tax credit is not enacted and is not return.",
  "/assets/documents/growth-fund-financials.pdf":
    "InvestRI Growth Fund I — Financial Summary (ILLUSTRATIVE)\n\nExample NAV unit value: 1.032 after seed valuation.\nExample distribution: $20 on a $1,000 position.\nTax credits are excluded from performance calculations.",
  "/assets/documents/growth-fund-manager-background.pdf":
    "InvestRI Growth Fund I — Manager Background (ILLUSTRATIVE)\n\nThe manager entity exists only inside this proof of concept.\nNo real AUM, registration, or performance record is implied.",
};
