import { describe, expect, it } from "vitest";
import { aggregateImpact } from "./impact";

describe("aggregateImpact", () => {
  it("sums verified metrics and flags self-reported rows", () => {
    const result = aggregateImpact([
      { key: "housing_units", value: "72", verificationStatus: "VERIFIED" },
      { key: "housing_units", value: "110", verificationStatus: "VERIFIED" },
      { key: "jobs", value: "4", verificationStatus: "PENDING_VERIFICATION" },
    ]);
    expect(result.totals.housing_units).toBe("182.0000");
    expect(result.totals.jobs).toBe("4.0000");
    expect(result.includesSelfReported).toBe(true);
  });

  it("ignores rejected reports", () => {
    const result = aggregateImpact([
      { key: "jobs", value: "35", verificationStatus: "VERIFIED" },
      { key: "jobs", value: "99", verificationStatus: "REJECTED" },
    ]);
    expect(result.totals.jobs).toBe("35.0000");
    expect(result.includesSelfReported).toBe(false);
  });
});
