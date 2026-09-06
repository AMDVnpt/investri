import type { AppConfig } from "@investri/config";
import { mockFlags } from "@investri/config";
import { createMockProviders } from "./mocks/index";
import type { AuditSink, ProviderRegistry } from "./types";

export * from "./types";
export { createMockProviders } from "./mocks/index";

export function createProviders(config: AppConfig, audit: AuditSink): ProviderRegistry {
  const flags = mockFlags(config);
  const mocks = createMockProviders(audit);

  if (!Object.values(flags).every(Boolean)) {
    console.warn(
      "A production provider flag is false, but only mock implementations exist in this POC. Using mocks.",
    );
  }

  return mocks;
}
