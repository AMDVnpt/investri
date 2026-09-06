import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  API_PORT: z.coerce.number().default(3001),
  API_PUBLIC_URL: z.string().default("http://localhost:3001"),
  WEB_ORIGIN: z.string().default("http://localhost:3003"),
  MANAGER_ORIGIN: z.string().default("http://localhost:3002"),
  COOKIE_SECURE: bool.default("false"),
  DEMO_PASSWORD: z.string().default("DemoPass123!"),
  USE_MOCK_KYC: bool.default("true"),
  USE_MOCK_RESIDENCY: bool.default("true"),
  USE_MOCK_ELIGIBILITY: bool.default("true"),
  USE_MOCK_BROKERAGE: bool.default("true"),
  USE_MOCK_FUNDING: bool.default("true"),
  USE_MOCK_CUSTODY: bool.default("true"),
  USE_MOCK_TRANSFER_AGENT: bool.default("true"),
  USE_MOCK_FUND_ADMIN: bool.default("true"),
  USE_MOCK_ESIGNATURE: bool.default("true"),
  USE_MOCK_DOCUMENT: bool.default("true"),
  USE_MOCK_NOTIFICATION: bool.default("true"),
  USE_MOCK_TAX_AGENCY: bool.default("true"),
  USE_MOCK_SSO: bool.default("true"),
  ALLOW_DEMO_RESET: bool.default("false"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}

export function mockFlags(config: AppConfig) {
  return {
    kyc: config.USE_MOCK_KYC,
    residency: config.USE_MOCK_RESIDENCY,
    eligibility: config.USE_MOCK_ELIGIBILITY,
    brokerage: config.USE_MOCK_BROKERAGE,
    funding: config.USE_MOCK_FUNDING,
    custody: config.USE_MOCK_CUSTODY,
    transferAgent: config.USE_MOCK_TRANSFER_AGENT,
    fundAdmin: config.USE_MOCK_FUND_ADMIN,
    eSignature: config.USE_MOCK_ESIGNATURE,
    document: config.USE_MOCK_DOCUMENT,
    notification: config.USE_MOCK_NOTIFICATION,
    taxAgency: config.USE_MOCK_TAX_AGENCY,
    sso: config.USE_MOCK_SSO,
  };
}
