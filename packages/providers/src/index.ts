import type { AppConfig } from "@investri/config";
import { mockFlags } from "@investri/config";
import { createMockProviders } from "./mocks/index";
import { createFundingProvider } from "./plaid";
import type { AuditSink, ProviderRegistry } from "./types";

export * from "./types";
export { createMockProviders } from "./mocks/index";
export { PLAID_DEMO_INSTITUTIONS } from "./plaid";

export function createProviders(config: AppConfig, audit: AuditSink): ProviderRegistry {
  const flags = mockFlags(config);
  const mocks = createMockProviders(audit);

  if (!Object.values(flags).every(Boolean)) {
    console.warn(
      "A production provider flag is false, but only mock implementations exist in this POC. Using mocks.",
    );
  }

  return {
    ...mocks,
    funding: createFundingProvider(config, mocks.funding),
  };
}
