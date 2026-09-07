import { randomUUID } from "node:crypto";
import type { AuditSink, ProviderRegistry } from "../types";

const now = () => new Date().toISOString();

const id = (prefix: string) => `${prefix}_${randomUUID()}`;

const lastFourByApplicant = new Map<string, string | undefined>();

function compareDecimalStrings(left: string, right: string) {
  const parts = (value: string) => {
    const [whole, fraction = ""] = value.split(".");
    return {
      whole: BigInt(whole || "0"),
      fraction: (fraction + "0000").slice(0, 4),
    };
  };
  const a = parts(left);
  const b = parts(right);
  if (a.whole === b.whole) {
    return a.fraction < b.fraction ? -1 : a.fraction > b.fraction ? 1 : 0;
  }
  return a.whole < b.whole ? -1 : 1;
}

export function createMockProviders(audit: AuditSink): ProviderRegistry {
  return {
    kyc: {
      async createApplicant(input) {
        const applicantId = id("kyc");
        lastFourByApplicant.set(applicantId, input.ssnLastFour);
        return { applicantId };
      },
      async startVerification() {
        return { providerToken: id("kyc_tok") };
      },
      async getVerificationStatus(applicantId) {
        const lastFour = lastFourByApplicant.get(applicantId);
        if (lastFour === "0000") {
          return {
            status: "failed",
            reason: "Identity verification failed",
          };
        }
        return { status: "passed" };
      },
    },
    residency: {
      async verifyResidence(input) {
        const state = input.state.trim().toUpperCase();
        if (state === "RI" && input.attestedRiResident) {
          return { status: "passed", evidenceId: id("res") };
        }
        return {
          status: "failed",
          evidenceId: id("res"),
          reason: "Rhode Island residency was not verified",
        };
      },
      async getEvidence() {
        return { summary: "Mock Rhode Island residency attestation" };
      },
    },
    eligibility: {
      async calculateInvestmentLimit(input) {
        const ceiling = "25000.0000";
        if (compareDecimalStrings(input.requestedAmount, ceiling) > 0) {
          return {
            permitted: false,
            maximumAmount: ceiling,
            reason: "DEMO_CEILING",
          };
        }
        return {
          permitted: true,
          maximumAmount: ceiling,
        };
      },
      async verifyAccreditation() {
        return { accredited: false };
      },
      async verifySuitability(input) {
        if (input.canBearLoss && input.acceptsIlliquidity) {
          return { suitable: true };
        }
        return {
          suitable: false,
          reason: "You must attest that you can bear a loss of principal and accept illiquidity",
        };
      },
    },
    brokerage: {
      async submitSubscription() {
        return { orderId: id("ord") };
      },
    },
    funding: {
      async createBankLinkToken() {
        return { linkToken: id("bank") };
      },
      async createPlaidLinkSession() {
        return {
          mode: "plaid_sandbox_mock" as const,
          linkToken: id("link"),
          expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          institutions: [
            {
              id: "ins_citizens",
              name: "Citizens Bank",
              accountName: "Plaid Checking",
              accountType: "checking",
              mask: "4412",
            },
          ],
        };
      },
      async exchangePlaidPublicToken(input) {
        return {
          institutionId: input.institutionId ?? "ins_citizens",
          institutionName: "Citizens Bank",
          accountId: id("acc"),
          accountName: "Plaid Checking",
          accountType: "checking",
          mask: "4412",
          linkToken: id("plaid"),
        };
      },
      async initiateTransfer() {
        return { transferId: id("xfer"), status: "settled" };
      },
    },
    custody: {
      async echoPosition() {
        return { custodyRef: id("cust") };
      },
    },
    transferAgent: {
      async recordOwnership() {
        return { transferRef: id("ta") };
      },
    },
    fundAdmin: {
      async echoNav() {
        return { nav: "1.0000", asOf: now() };
      },
    },
    eSignature: {
      async createEnvelope() {
        return { envelopeId: id("esign"), signedAt: now() };
      },
    },
    document: {
      async store(input) {
        return { objectKey: `local/${input.filename}` };
      },
      async resolveUrl(objectKey) {
        return `/assets/documents/${objectKey}`;
      },
    },
    notification: {
      async send(input) {
        console.info("[notification:mock]", input.template, input.userId);
      },
    },
    taxAgency: {
      async exportCertificates(_taxYear) {
        return { exportId: id("tax"), count: 0 };
      },
    },
    sso: {
      async startSso() {
        return null;
      },
    },
    audit,
  };
}
