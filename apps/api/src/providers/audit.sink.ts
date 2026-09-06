import { Injectable } from "@nestjs/common";
import { prisma } from "@investri/database";
import type { AuditSink } from "@investri/providers";

@Injectable()
export class PrismaAuditSink implements AuditSink {
  async write(event: Parameters<AuditSink["write"]>[0]): Promise<void> {
    await prisma.auditEvent.create({
      data: {
        actorUserId: event.actorUserId,
        actorRole: event.actorRole,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        beforeJson: event.beforeJson as object | undefined,
        afterJson: event.afterJson as object | undefined,
        reasonCode: event.reasonCode,
        sourceIp: event.sourceIp,
        userAgent: event.userAgent,
        correlationId: event.correlationId,
      },
    });
  }
}
