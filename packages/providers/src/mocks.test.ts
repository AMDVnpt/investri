import { describe, expect, it } from "vitest";
import { createMockProviders } from "./mocks/index";

describe("mock providers", () => {
  it("returns passed KYC without storing an SSN", async () => {
    const providers = createMockProviders({ write: async () => undefined });
    const applicant = await providers.kyc.createApplicant({
      userId: "user-1",
      email: "alex.smith@demo.investri.ri",
    });
    const started = await providers.kyc.startVerification(applicant.applicantId);
    const status = await providers.kyc.getVerificationStatus(applicant.applicantId);
    expect(started.providerToken).toMatch(/^kyc_tok_/);
    expect(status.status).toBe("passed");
  });

  it("fails KYC when the last-four is 0000", async () => {
    const providers = createMockProviders({ write: async () => undefined });
    const applicant = await providers.kyc.createApplicant({
      userId: "user-1",
      email: "fail@demo.investri.ri",
      ssnLastFour: "0000",
    });
    const status = await providers.kyc.getVerificationStatus(applicant.applicantId);
    expect(status.status).toBe("failed");
  });

  it("passes RI residency and fails Massachusetts", async () => {
    const providers = createMockProviders({ write: async () => undefined });
    const ri = await providers.residency.verifyResidence({
      userId: "user-1",
      street: "12 Benefit St",
      city: "Providence",
      state: "RI",
      postalCode: "02903",
      attestedRiResident: true,
    });
    const ma = await providers.residency.verifyResidence({
      userId: "user-1",
      street: "1 Main St",
      city: "Boston",
      state: "MA",
      postalCode: "02101",
      attestedRiResident: true,
    });
    expect(ri.status).toBe("passed");
    expect(ma.status).toBe("failed");
  });

  it("fails suitability without loss-bearing and illiquidity attestations", async () => {
    const providers = createMockProviders({ write: async () => undefined });
    const failed = await providers.eligibility.verifySuitability({
      userId: "user-1",
      canBearLoss: false,
      acceptsIlliquidity: true,
    });
    const passed = await providers.eligibility.verifySuitability({
      userId: "user-1",
      canBearLoss: true,
      acceptsIlliquidity: true,
    });
    expect(failed.suitable).toBe(false);
    expect(passed.suitable).toBe(true);
  });

  it("never returns a bank credential", async () => {
    const providers = createMockProviders({ write: async () => undefined });
    const link = await providers.funding.createBankLinkToken("user-1");
    expect(link.linkToken).toMatch(/^bank_/);
    const session = await providers.funding.createPlaidLinkSession("user-1");
    expect(session.mode).toBe("plaid_sandbox_mock");
    const account = await providers.funding.exchangePlaidPublicToken({
      userId: "user-1",
      publicToken: "public-sandbox-mock-citizens",
      institutionId: "ins_citizens",
    });
    expect(account.institutionName).toBe("Citizens Bank");
    expect(account.mask).toBe("4412");
    expect(account.accountType).toBe("checking");
    expect(JSON.stringify(account)).not.toMatch(/routing|accountNumber|password/i);
  });
});
