import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@investri/database";

export const NotificationType = {
  investment_settled: "investment_settled",
  distribution_received: "distribution_received",
  nav_updated: "nav_updated",
  tax_credit_certified: "tax_credit_certified",
  statement_available: "statement_available",
  manager_update: "manager_update",
  project_milestone: "project_milestone",
  required_action: "required_action",
} as const;

@Injectable()
export class NotificationsService {
  async notify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType: string;
    entityId: string;
  }) {
    const existing = await prisma.notification.findUnique({
      where: {
        userId_type_entityId: {
          userId: input.userId,
          type: input.type,
          entityId: input.entityId,
        },
      },
    });
    if (existing) {
      return existing;
    }
    console.info("[notification:mock]", input.type, input.userId);
    return prisma.notification.create({ data: input });
  }

  list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markRead(userId: string, id: string) {
    const row = await prisma.notification.findFirst({ where: { id, userId } });
    if (!row) {
      throw new NotFoundException("Notification not found");
    }
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async preferences(userId: string) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(
    userId: string,
    input: { pushEnabled?: boolean; emailEnabled?: boolean; smsEnabled?: boolean },
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
  }
}
