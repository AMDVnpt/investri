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
