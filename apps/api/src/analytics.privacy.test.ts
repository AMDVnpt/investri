import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsProperties } from "@investri/analytics";

describe("analytics privacy", () => {
  it("omits email and SSN keys", () => {
    const clean = sanitizeAnalyticsProperties({
      email: "alex@example.com",
      ssnLastFour: "1234",
      offeringId: "abc",
      authenticated: true,
    });
    expect(clean).toEqual({ offeringId: "abc", authenticated: true });
  });
});
