import type { AppConfig } from "@investri/config";
import type { FundingProvider, LinkedBankAccount, PlaidLinkSession } from "./types";

export const PLAID_DEMO_INSTITUTIONS = [
  {
    id: "ins_citizens",
    name: "Citizens Bank",
    accountName: "Plaid Checking",
    accountType: "checking",
    mask: "4412",
  },
  {
    id: "ins_bankri",
    name: "BankRI",
    accountName: "Everyday Checking",
    accountType: "checking",
    mask: "9088",
  },
  {
    id: "ins_washington_trust",
    name: "Washington Trust",
    accountName: "Preferred Checking",
    accountType: "checking",
    mask: "2271",
  },
  {
    id: "ins_boa",
    name: "Bank of America",
    accountName: "Advantage Plus",
    accountType: "checking",
    mask: "3344",
  },
  {
    id: "ins_chase",
    name: "Chase",
    accountName: "Total Checking",
    accountType: "checking",
    mask: "6789",
  },
] as const;

function plaidHost(env: AppConfig["PLAID_ENV"]) {
  if (env === "production") {
    return "https://production.plaid.com";
  }
  if (env === "development") {
    return "https://development.plaid.com";
  }
  return "https://sandbox.plaid.com";
}

function hasPlaidCredentials(config: AppConfig) {
  return Boolean(config.PLAID_CLIENT_ID && config.PLAID_SECRET);
}

async function plaidRequest<T>(
  config: AppConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${plaidHost(config.PLAID_ENV)}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.PLAID_CLIENT_ID,
      secret: config.PLAID_SECRET,
      ...body,
    }),
  });
  const data = (await response.json()) as T & { error_message?: string };
  if (!response.ok) {
    throw new Error(data.error_message ?? "Plaid request failed");
  }
  return data;
}

function mockSession(): PlaidLinkSession {
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return {
    mode: "plaid_sandbox_mock",
    linkToken: `link-sandbox-mock-${Date.now()}`,
    expiration: expires,
    institutions: PLAID_DEMO_INSTITUTIONS.map((row) => ({ ...row })),
  };
}

function mockAccount(institutionId?: string): LinkedBankAccount {
  const institution =
    PLAID_DEMO_INSTITUTIONS.find((row) => row.id === institutionId) ?? PLAID_DEMO_INSTITUTIONS[0];
  return {
    institutionId: institution.id,
    institutionName: institution.name,
    accountId: `acc_${institution.id}`,
    accountName: institution.accountName,
    accountType: institution.accountType,
    mask: institution.mask,
    linkToken: `plaid_${institution.id}_${institution.mask}`,
  };
}

export function createFundingProvider(
  config: AppConfig,
  fallback: FundingProvider,
): FundingProvider {
  return {
    createBankLinkToken: fallback.createBankLinkToken,
    initiateTransfer: fallback.initiateTransfer,
    async createPlaidLinkSession(userId) {
      if (!hasPlaidCredentials(config)) {
        return mockSession();
      }
      try {
        const created = await plaidRequest<{
          link_token: string;
          expiration: string;
        }>(config, "/link/token/create", {
          user: { client_user_id: userId },
          client_name: "InvestRI",
          products: ["auth"],
          country_codes: ["US"],
          language: "en",
        });
        return {
          mode: "plaid",
          linkToken: created.link_token,
          expiration: created.expiration,
          institutions: PLAID_DEMO_INSTITUTIONS.map((row) => ({ ...row })),
        };
      } catch {
        return mockSession();
      }
    },
    async exchangePlaidPublicToken(input) {
      if (!hasPlaidCredentials(config) || input.publicToken.startsWith("public-sandbox-mock")) {
        return mockAccount(input.institutionId);
      }
      try {
        const exchanged = await plaidRequest<{ access_token: string }>(
          config,
          "/item/public_token/exchange",
          { public_token: input.publicToken },
        );
        const accounts = await plaidRequest<{
          accounts: { account_id: string; name: string; subtype?: string; mask?: string }[];
          item: { institution_id?: string };
        }>(config, "/accounts/get", { access_token: exchanged.access_token });
        const account = accounts.accounts[0];
        const institutionId = accounts.item.institution_id ?? input.institutionId ?? "ins_unknown";
        const known = PLAID_DEMO_INSTITUTIONS.find((row) => row.id === institutionId);
        return {
          institutionId,
          institutionName: known?.name ?? "Connected bank",
          accountId: account?.account_id ?? "acc_unknown",
          accountName: account?.name ?? "Checking",
          accountType: account?.subtype ?? "checking",
          mask: account?.mask ?? "0000",
          linkToken: `plaid_${exchanged.access_token.slice(-12)}`,
        };
      } catch {
        return mockAccount(input.institutionId);
      }
    },
  };
}
