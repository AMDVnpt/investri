import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@investri/database";
import {
  CapEntryType,
  RoleName,
  TaxCreditStatus,
  calculateTaxCredit,
  carryforwardExpires,
  money,
  moneyString,
  wouldExceedCap,
} from "@investri/domain";
import { randomBytes, randomUUID } from "node:crypto";
import type { RequestUser } from "../common/current-user";
import { NotificationType, NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class TaxCreditEngineService {
  constructor(private readonly notifications?: NotificationsService) {}
  async createOnSettle(input: {
    userId: string;
    positionId: string;
    offeringId: string;
    amount: string;
    residencyPassed: boolean;
  }) {
    const offering = await prisma.offering.findUnique({
      where: { id: input.offeringId },
      include: { taxCreditProgram: { include: { schedules: { orderBy: { yearIndex: "asc" } } } } },
    });
    const program = offering?.taxCreditProgram;
    if (!program) {
      return null;
    }
    const existing = await prisma.taxCreditEntitlement.findUnique({
      where: { positionId: input.positionId },
    });
    if (existing) {
      return existing;
    }
    const calc = calculateTaxCredit({
      qualifiedBasis: input.amount,
      creditRate: moneyString(program.creditRate, 6),
      vestingSchedule: program.schedules.map((row) => ({
        yearIndex: row.yearIndex,
        rate: moneyString(row.rate, 6),
      })),
      vestingMethod: program.vestingMethod,
      certificationStatus: TaxCreditStatus.pending_commerce_review,
    });
    const status = input.residencyPassed
      ? TaxCreditStatus.pending_commerce_review
      : TaxCreditStatus.pending_residency_verification;
    const entitlement = await prisma.taxCreditEntitlement.create({
      data: {
        userId: input.userId,
        positionId: input.positionId,
        programId: program.id,
        qualifiedBasis: input.amount,
        potentialCredit: calc.potentialCredit,
        earnedCredit: calc.earnedCredit,
        status,
        vestingEvents: {
          create: program.schedules.map((row) => ({
            yearIndex: row.yearIndex,
            amount: moneyString(money(input.amount).mul(money(moneyString(row.rate, 6)))),
            vestsOn: new Date(Date.UTC(new Date().getUTCFullYear() + row.yearIndex, 0, 15)),
            status: row.yearIndex === 0 ? "earned" : "scheduled",
          })),
        },
      },
    });
    await prisma.programCapLedger.upsert({
      where: { idempotencyKey: `reserve-${input.positionId}` },
      update: {},
      create: {
        programId: program.id,
        entryType: CapEntryType.RESERVED,
        amount: calc.potentialCredit,
        offeringId: input.offeringId,
        entitlementId: entitlement.id,
        idempotencyKey: `reserve-${input.positionId}`,
      },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: input.userId,
        action: "tax_credit.entitlement_created",
        entityType: "TaxCreditEntitlement",
        entityId: entitlement.id,
        afterJson: { status, potentialCredit: calc.potentialCredit },
        correlationId: randomUUID(),
      },
    });
    return entitlement;
  }

  async listForUser(userId: string) {
    const rows = await prisma.taxCreditEntitlement.findMany({
      where: { userId },
      include: {
        program: true,
        position: { include: { offering: true } },
        vestingEvents: { orderBy: { yearIndex: "asc" } },
        certificates: { where: { voidedAt: null }, orderBy: { issuedAt: "desc" } },
      },
    });
    return rows.map((row) => this.toCitizen(row));
  }

  async getForUser(userId: string, id: string) {
    const row = await prisma.taxCreditEntitlement.findFirst({
      where: { id, userId },
      include: {
        program: true,
        position: { include: { offering: true } },
        vestingEvents: { orderBy: { yearIndex: "asc" } },
        certificates: { where: { voidedAt: null }, orderBy: { issuedAt: "desc" } },
      },
    });
    if (!row) {
      throw new NotFoundException("Tax credit entitlement not found");
    }
    return this.toCitizen(row);
  }

  async listAdmin() {
    return prisma.taxCreditEntitlement.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        position: { include: { offering: true } },
        program: true,
        certificates: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async certify(
    actor: RequestUser,
    id: string,
    input: { amount?: string; reason: string; reasonCode: string },
  ) {
    if (actor.roles.includes(RoleName.FUND_MANAGER) && !actor.roles.includes(RoleName.SYSTEM_ADMIN)) {
      throw new ForbiddenException("Fund managers cannot certify tax credits");
    }
    const entitlement = await prisma.taxCreditEntitlement.findUniqueOrThrow({
      where: { id },
      include: { program: { include: { schedules: true } }, certificates: true, position: true },
    });
    const amount = input.amount ?? moneyString(money(moneyString(entitlement.potentialCredit)).mul(money("0.25")));
    const prior = entitlement.certificates.find((row) => !row.voidedAt);
    const remainingAuthority = await this.remainingCap(entitlement.programId);
    const remainingAfterRelease = prior
      ? moneyString(money(remainingAuthority).add(money(moneyString(prior.certifiedAmount))))
      : remainingAuthority;
    if (wouldExceedCap(remainingAfterRelease, amount)) {
      throw new ConflictException({
        statusCode: 409,
        message: "Certification would exceed the remaining program cap",
      });
    }
    const calc = calculateTaxCredit({
      qualifiedBasis: moneyString(entitlement.qualifiedBasis),
      creditRate: moneyString(entitlement.program.creditRate, 6),
      vestingSchedule: entitlement.program.schedules.map((row) => ({
        yearIndex: row.yearIndex,
        rate: moneyString(row.rate, 6),
      })),
      certificationStatus: TaxCreditStatus.certified,
      certifiedAmount: amount,
      remainingProgramCap: remainingAfterRelease,
    });
    if (prior) {
      await prisma.taxCreditCertificate.update({
        where: { id: prior.id },
        data: { voidedAt: new Date(), voidReason: input.reason },
      });
      await prisma.programCapLedger.create({
        data: {
          programId: entitlement.programId,
          entryType: CapEntryType.RELEASED,
          amount: moneyString(prior.certifiedAmount),
          entitlementId: entitlement.id,
          idempotencyKey: `release-${prior.id}`,
        },
      });
    }
    const taxYear = new Date().getUTCFullYear();
    const issuedCount = await prisma.taxCreditCertificate.count({ where: { taxYear } });
    const number = `RI-INV-${taxYear}-${String(issuedCount + 1).padStart(4, "0")}`;
    const document = await prisma.investorDocument.create({
      data: {
        userId: entitlement.userId,
        positionId: entitlement.positionId,
        category: "RI_TAX_CREDIT_CERTIFICATE",
        taxYear,
        title: `Rhode Island investment tax credit certificate ${number}`,
        url: `/api/v1/tax-credits/${entitlement.id}/certificate`,
      },
    });
    const certificate = await prisma.taxCreditCertificate.create({
      data: {
        entitlementId: entitlement.id,
        number,
        taxYear,
        certifiedAmount: amount,
        availableAmount: amount,
        carryforwardExpiresOn: new Date(Date.UTC(carryforwardExpires(taxYear, entitlement.program.carryforwardYears ?? 5), 11, 31)),
        documentId: document.id,
        commerceApprovedBy: actor.id,
        supersedesCertificateId: prior?.id ?? null,
        validationCode: randomBytes(6).toString("hex"),
      },
    });
    await prisma.programCapLedger.create({
      data: {
        programId: entitlement.programId,
        entryType: CapEntryType.CERTIFIED,
        amount,
        entitlementId: entitlement.id,
        idempotencyKey: `certify-${certificate.id}`,
      },
    });
    const updated = await prisma.taxCreditEntitlement.update({
      where: { id },
      data: {
        certifiedCredit: calc.certifiedCredit,
        earnedCredit: calc.earnedCredit,
        status: TaxCreditStatus.certified,
      },
    });
    await prisma.auditEvent.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.roles[0],
        action: "tax_credit.certified",
        entityType: "TaxCreditEntitlement",
        entityId: id,
        afterJson: { certificateId: certificate.id, amount, reasonCode: input.reasonCode },
        reasonCode: input.reasonCode,
        correlationId: randomUUID(),
      },
    });
    await this.notifications?.notify({
      userId: entitlement.userId,
      type: NotificationType.tax_credit_certified,
      title: "Tax credit certified",
      body: "Your Rhode Island investment tax credit has been certified.",
      entityType: "TaxCreditEntitlement",
      entityId: id,
    });
    return { entitlement: updated, certificate };
  }

  async adjust(actor: RequestUser, id: string, input: { amount: string; reason: string; reasonCode: string }) {
    await prisma.taxCreditAdjustment.create({
      data: {
        entitlementId: id,
        amount: input.amount,
        reason: input.reason,
        reasonCode: input.reasonCode,
      },
    });
    const entitlement = await prisma.taxCreditEntitlement.findUniqueOrThrow({ where: { id } });
    const nextBasis = money(moneyString(entitlement.qualifiedBasis)).add(money(input.amount));
    return prisma.taxCreditEntitlement.update({
      where: { id },
      data: {
        qualifiedBasis: moneyString(nextBasis),
        potentialCredit: moneyString(nextBasis.mul(money("0.20"))),
      },
    });
  }

  async remainingCap(programId: string) {
    const program = await prisma.taxCreditProgram.findUniqueOrThrow({ where: { id: programId } });
    const authorized = program.totalProgramCap ? moneyString(program.totalProgramCap) : "0";
    const entries = await prisma.programCapLedger.findMany({ where: { programId } });
    const consumed = entries.reduce((sum, row) => {
      if (row.entryType === CapEntryType.CERTIFIED) {
        return sum.add(money(moneyString(row.amount)));
      }
      if (row.entryType === CapEntryType.RELEASED || row.entryType === CapEntryType.RECAPTURED) {
        return sum.sub(money(moneyString(row.amount)));
      }
      return sum;
    }, money("0"));
    return moneyString(money(authorized).sub(consumed));
  }

  certificatePdf(input: {
    number: string;
    taxpayerName: string;
    taxYear: number;
    offeringName: string;
    certifiedAmount: string;
    issueDate: string;
    carryforwardYears: number;
    approverId: string;
    validationCode: string;
  }) {
    const body = [
      "InvestRI Resident Investment Credit — PROPOSED / ILLUSTRATIVE",
      `Certificate ${input.number}`,
      `Taxpayer: ${input.taxpayerName}`,
      `Tax year: ${input.taxYear}`,
      `Offering: ${input.offeringName}`,
      `Certified amount: $${input.certifiedAmount}`,
      "Statutory citation: proposed / illustrative — subject to enabling legislation",
      `Issue date: ${input.issueDate}`,
      `Carryforward years: ${input.carryforwardYears}`,
      `Commerce approver: ${input.approverId}`,
      `Validation code: ${input.validationCode}`,
    ].join("\n");
    return Buffer.from(body, "utf8");
  }

  private toCitizen(row: {
    id: string;
    status: string;
    qualifiedBasis: { toString(): string };
    potentialCredit: { toString(): string };
    earnedCredit: { toString(): string };
    certifiedCredit: { toString(): string };
    claimedCredit: { toString(): string };
    program: { name: string; status: string; carryforwardYears: number | null };
    position: { offering: { name: string } };
    vestingEvents: { yearIndex: number; amount: { toString(): string }; vestsOn: Date; status: string }[];
    certificates: { id: string; number: string; certifiedAmount: { toString(): string }; taxYear: number }[];
  }) {
    const available = money(moneyString(row.certifiedCredit.toString())).sub(
      money(moneyString(row.claimedCredit.toString())),
    );
    const next = row.vestingEvents.find((event) => event.status === "scheduled");
    return {
      id: row.id,
      programName: row.program.name,
      programStatus: row.program.status,
      offeringName: row.position.offering.name,
      status: row.status,
      proposed: row.program.status === "PROPOSED",
      buckets: {
        estimated: moneyString(row.potentialCredit.toString()),
        earned: moneyString(row.earnedCredit.toString()),
        certified: moneyString(row.certifiedCredit.toString()),
        available: moneyString(available.lt(0) ? money("0") : available),
        claimed: moneyString(row.claimedCredit.toString()),
      },
      vesting: row.vestingEvents.map((event) => ({
        yearIndex: event.yearIndex,
        amount: moneyString(event.amount.toString()),
        vestsOn: event.vestsOn,
        status: event.status,
      })),
      certificates: row.certificates,
      nextVestingDate: next?.vestsOn ?? null,
      copy:
        row.status === TaxCreditStatus.certified
          ? "A portion of this credit has been certified. It is still proposed legislation and is not cash."
          : "You have not received this credit. Amounts are estimated until Commerce certifies them.",
    };
  }
}
