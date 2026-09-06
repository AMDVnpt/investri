export type OfferingCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  thesis: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  managerName: string;
  minInvestmentLabel: string;
  targetReturnLabel: string | null;
  targetTermMonths: number | null;
  distributionFrequency: string;
  riskLevel: string;
  residentOnly: boolean;
  status: string;
  isIllustrative: boolean;
  fundingRatio: string;
  taxCredit: { eligible: boolean; badge?: string; programStatus?: string };
};

export type OfferingDetail = OfferingCard & {
  description: string;
  liquidityDescription: string;
  fees: { name: string; description: string; amountLabel: string }[];
  allocations: { key: string; label: string; percentage: string }[];
  risks: { title: string; summary: string; body: string; isSummary: boolean }[];
  documents: { id: string; title: string; category: string; url: string }[];
  updates: { id: string; title: string; body: string }[];
  projects: ProjectCard[];
  taxCreditIllustration: {
    exampleInvestment: string;
    potentialCredit: string;
    cashTransferredToday: string;
    disclaimer: string;
    programStatus: string;
    programId: string;
  } | null;
};

export type ProjectCard = {
  id: string;
  name: string;
  municipality: string;
  sector: string;
  heroImageUrl: string | null;
  imageAlt: string | null;
  amountDeployedLabel: string;
  isIllustrative: boolean;
  metrics: { label: string; value: string; unit: string }[];
};

export type OnboardingStatusResponse = {
  status: string;
  nextStep: string | null;
  blockers: string[];
  eligibleToInvest: boolean;
  requiredKeys: string[];
  acceptedKeys: string[];
  pendingKeys: string[];
};

export type MeResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  onboardingStatus: string;
  eligibleToInvest: boolean;
};
