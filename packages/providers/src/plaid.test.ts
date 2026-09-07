import { describe, expect, it } from "vitest";
import type { AppConfig } from "@investri/config";
import { createMockProviders } from "./mocks/index";
import { createFundingProvider } from "./plaid";

describe("Plaid funding provider", () => {
  it("returns a labeled mock session when credentials are missing", async () => {
    const config = { PLAID_ENV: "sandbox" } as AppConfig;
    const funding = createFundingProvider(config, createMockProviders({ write: async () => undefined }).funding);
    const session = await funding.createPlaidLinkSession("user-1");
    expect(session.mode).toBe("plaid_sandbox_mock");
    expect(session.institutions[0]?.name).toBe("Citizens Bank");
    const account = await funding.exchangePlaidPublicToken({
      userId: "user-1",
      publicToken: "public-sandbox-mock-citizens",
      institutionId: "ins_citizens",
    });
    expect(account.mask).toBe("4412");
    expect(account.accountType).toBe("checking");
    expect(account.linkToken).toContain("plaid_");
  });
});
