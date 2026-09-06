export const AnalyticsEvent = {
  ACCOUNT_CREATED: "account_created",
  OFFERING_VIEWED: "offering_viewed",
  DOCUMENT_OPENED: "document_opened",
  IMPACT_VIEWED: "impact_viewed",
  IDENTITY_STARTED: "identity_started",
  IDENTITY_PASSED: "identity_passed",
  RESIDENCY_PASSED: "residency_passed",
  INVESTMENT_STARTED: "investment_started",
  INVESTMENT_SUBMITTED: "investment_submitted",
  FUNDED: "funded",
  SETTLED: "settled",
} as const;

const BLOCKED_KEYS = /email|ssn|password|phone|address/i;

export function sanitizeAnalyticsProperties(
  properties?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!properties) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => !BLOCKED_KEYS.test(key)),
  );
}

export type AnalyticsEvent = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export interface AnalyticsSink {
  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void;
}

export const noopAnalytics: AnalyticsSink = {
  track(event, properties) {
    void event;
    void sanitizeAnalyticsProperties(properties);
  },
};
