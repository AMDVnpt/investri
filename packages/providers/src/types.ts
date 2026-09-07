export type VerificationStatus = "pending" | "passed" | "failed";

export interface KycProvider {
  createApplicant(input: {
    userId: string;
    email: string;
    ssnLastFour?: string;
  }): Promise<{ applicantId: string }>;
  startVerification(applicantId: string): Promise<{ providerToken: string }>;
  getVerificationStatus(
    applicantId: string,
  ): Promise<{ status: VerificationStatus; reason?: string }>;
}

export interface ResidencyProvider {
  verifyResidence(input: {
    userId: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    attestedRiResident: boolean;
  }): Promise<{ status: VerificationStatus; evidenceId: string; reason?: string }>;
  getEvidence(evidenceId: string): Promise<{ summary: string }>;
}

export interface InvestorEligibilityProvider {
  calculateInvestmentLimit(input: {
    userId: string;
    offeringId: string;
    requestedAmount: string;
  }): Promise<{ permitted: boolean; maximumAmount: string; reason?: string }>;
  verifyAccreditation(userId: string): Promise<{ accredited: boolean }>;
  verifySuitability(input: {
    userId: string;
    canBearLoss: boolean;
    acceptsIlliquidity: boolean;
  }): Promise<{ suitable: boolean; reason?: string }>;
}

export interface BrokerageProvider {
  submitSubscription(input: {
    userId: string;
    offeringId: string;
    amount: string;
  }): Promise<{ orderId: string }>;
}

export type PlaidLinkMode = "plaid" | "plaid_sandbox_mock";

export type LinkedBankAccount = {
  institutionId: string;
  institutionName: string;
  accountId: string;
  accountName: string;
  accountType: string;
  mask: string;
  linkToken: string;
};

export type PlaidLinkSession = {
  mode: PlaidLinkMode;
  linkToken: string;
  expiration: string;
  institutions: {
    id: string;
    name: string;
    accountName: string;
    accountType: string;
    mask: string;
  }[];
};

export interface FundingProvider {
  createBankLinkToken(userId: string): Promise<{ linkToken: string }>;
  createPlaidLinkSession(userId: string): Promise<PlaidLinkSession>;
  exchangePlaidPublicToken(input: {
    userId: string;
    publicToken: string;
    institutionId?: string;
  }): Promise<LinkedBankAccount>;
  initiateTransfer(input: {
    userId: string;
    amount: string;
    bankLinkToken: string;
  }): Promise<{ transferId: string; status: "pending" | "settled" }>;
}

export interface CustodyProvider {
  echoPosition(input: {
    accountId: string;
    offeringId: string;
    amount: string;
  }): Promise<{ custodyRef: string }>;
}

export interface TransferAgentProvider {
  recordOwnership(input: {
    accountId: string;
    offeringId: string;
    units: string;
  }): Promise<{ transferRef: string }>;
}

export interface FundAdminProvider {
  echoNav(offeringId: string): Promise<{ nav: string; asOf: string }>;
}

export interface ESignatureProvider {
  createEnvelope(input: {
    userId: string;
    documentKey: string;
  }): Promise<{ envelopeId: string; signedAt: string }>;
}

export interface DocumentProvider {
  store(input: {
    filename: string;
    bytes: Uint8Array;
  }): Promise<{ objectKey: string }>;
  resolveUrl(objectKey: string): Promise<string>;
}

export interface NotificationProvider {
  send(input: {
    userId: string;
    channel: "push" | "email" | "sms" | "log";
    template: string;
    payload: Record<string, string>;
  }): Promise<void>;
}

export interface TaxAgencyProvider {
  exportCertificates(taxYear: number): Promise<{ exportId: string; count: number }>;
}

export interface IdentityProvider {
  startSso(email: string): Promise<{ redirectUrl: string } | null>;
}

export interface AuditSink {
  write(event: {
    actorUserId?: string;
    actorRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeJson?: unknown;
    afterJson?: unknown;
    reasonCode?: string;
    sourceIp?: string;
    userAgent?: string;
    correlationId: string;
  }): Promise<void>;
}

export interface ProviderRegistry {
  kyc: KycProvider;
  residency: ResidencyProvider;
  eligibility: InvestorEligibilityProvider;
  brokerage: BrokerageProvider;
  funding: FundingProvider;
  custody: CustodyProvider;
  transferAgent: TransferAgentProvider;
  fundAdmin: FundAdminProvider;
  eSignature: ESignatureProvider;
  document: DocumentProvider;
  notification: NotificationProvider;
  taxAgency: TaxAgencyProvider;
  sso: IdentityProvider;
  audit: AuditSink;
}
