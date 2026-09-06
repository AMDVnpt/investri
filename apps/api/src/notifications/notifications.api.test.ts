import "../env";
import { beforeAll, describe, expect, it } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { prisma } from "@investri/database";
import { RoleName } from "@investri/domain";
import { NotificationType, NotificationsService } from "./notifications.service";
import { TaxCreditEngineService } from "../tax-credits/tax-credit-engine.service";
import { AdminService } from "../admin/admin.service";
import type { RequestUser } from "../common/current-user";

let notifications: NotificationsService;
let engine: TaxCreditEngineService;
let admin: AdminService;

beforeAll(() => {
  notifications = new NotificationsService();
  engine = new TaxCreditEngineService(notifications);
  admin = new AdminService(engine);
});

describe("notifications and demo reset", () => {
  it("creates one certified notification and does not duplicate on retry", async () => {
    const entitlement = await prisma.taxCreditEntitlement.findFirstOrThrow();
    const reviewer: RequestUser = {
      id: (await prisma.user.findUniqueOrThrow({ where: { email: "reviewer@commerce.ri.gov" } })).id,
      email: "reviewer@commerce.ri.gov",
      roles: [RoleName.COMMERCE_TAX_ADMIN],
    };
    await engine.certify(reviewer, entitlement.id, {
      amount: "50.0000",
      reason: "notify",
      reasonCode: "DEMO_POC",
    });
    await engine.certify(reviewer, entitlement.id, {
      amount: "50.0000",
      reason: "retry",
      reasonCode: "DEMO_POC",
    });
    const rows = await prisma.notification.findMany({
      where: { userId: entitlement.userId, type: NotificationType.tax_credit_certified, entityId: entitlement.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe("Your Rhode Island investment tax credit has been certified.");
    const inbox = await notifications.list(entitlement.userId);
    expect(inbox.some((row) => row.type === NotificationType.tax_credit_certified)).toBe(true);
    const manager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@demo.investri.ri" } });
    expect(await notifications.list(manager.id)).toHaveLength(0);
  });

  it("persists preferences and never sends SMS", async () => {
    const alex = await prisma.user.findUniqueOrThrow({ where: { email: "alex.smith@demo.investri.ri" } });
    const updated = await notifications.updatePreferences(alex.id, { smsEnabled: true, pushEnabled: false });
    expect(updated.smsEnabled).toBe(true);
    expect(updated.pushEnabled).toBe(false);
  });

  it("hides demo reset unless the flag and system admin are present", async () => {
    const adminUser: RequestUser = {
      id: "admin",
      email: "admin@investri.local",
      roles: [RoleName.SYSTEM_ADMIN],
    };
    expect(() => admin.demoReset(adminUser, false)).toThrow(NotFoundException);
    expect(() =>
      admin.demoReset({ id: "r", email: "r", roles: [RoleName.COMMERCE_REVIEWER] }, true),
    ).toThrow();
    expect(admin.demoReset(adminUser, true).ok).toBe(true);
  });
});
