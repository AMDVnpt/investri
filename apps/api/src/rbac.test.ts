import { describe, expect, it } from "vitest";
import { Permission, RoleName, hasPermission } from "@investri/domain";

describe("RBAC", () => {
  it("never lets a fund manager certify a tax credit", () => {
    expect(hasPermission([RoleName.FUND_MANAGER], Permission.TAX_CREDIT_CERTIFY)).toBe(false);
  });

  it("lets a commerce tax admin certify a tax credit", () => {
    expect(hasPermission([RoleName.COMMERCE_TAX_ADMIN], Permission.TAX_CREDIT_CERTIFY)).toBe(true);
  });

  it("lets a reviewer read offerings but not publish", () => {
    expect(hasPermission([RoleName.COMMERCE_REVIEWER], Permission.OFFERING_READ)).toBe(true);
    expect(hasPermission([RoleName.COMMERCE_REVIEWER], Permission.OFFERING_PUBLISH)).toBe(false);
  });
});
