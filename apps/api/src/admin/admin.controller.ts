import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Permissions } from "../auth/permissions.decorator";
import { OfferingStatus, Permission } from "@investri/domain";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { prisma } from "@investri/database";
import { TaxCreditEngineService } from "../tax-credits/tax-credit-engine.service";
import { loadConfig } from "@investri/config";
import { AdminService } from "./admin.service";
import { ImpactService } from "../impact/impact.service";
import { AuthService } from "../auth/auth.service";
import {
  offeringActionSchema,
  recaptureReviewSchema,
  taxCreditAdjustSchema,
  taxCreditReasonSchema,
} from "@investri/validation";

function parse<T>(schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.issues[0]?.message ?? "Invalid request");
  }
  return result.data;
}

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly taxCredits: TaxCreditEngineService,
    private readonly admin: AdminService,
    private readonly impact: ImpactService,
    private readonly auth: AuthService,
  ) {}

  @Get("health")
  @Permissions(Permission.OFFERING_READ)
  health() {
    return { ok: true, surface: "commerce-console" };
  }

  @Get("me")
  @Permissions(Permission.OFFERING_READ)
  me(@CurrentUser() user: RequestUser) {
    return this.auth.getUser(user.id);
  }

  @Get("dashboard")
  @Permissions(Permission.OFFERING_READ)
  dashboard() {
    return this.admin.dashboard();
  }

  @Get("offerings")
  @Permissions(Permission.OFFERING_READ)
  offerings() {
    return prisma.offering.findMany({
      include: { manager: true, taxCreditProgram: true },
      orderBy: { name: "asc" },
    });
  }

  @Post("offerings/:id/approve")
  @Permissions(Permission.OFFERING_PUBLISH)
  approve(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(offeringActionSchema, body);
    return this.admin.transitionOffering(user, id, OfferingStatus.LIVE, input);
  }

  @Post("offerings/:id/request-changes")
  @Permissions(Permission.OFFERING_PUBLISH)
  requestChanges(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(offeringActionSchema, body);
    return this.admin.transitionOffering(user, id, OfferingStatus.CHANGES_REQUESTED, input);
  }

  @Post("offerings/:id/pause")
  @Permissions(Permission.OFFERING_PUBLISH)
  pause(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = parse(offeringActionSchema, body);
    return this.admin.transitionOffering(user, id, OfferingStatus.PAUSED, input);
  }

  @Get("tax-credits")
  @Permissions(Permission.TAX_CREDIT_READ)
  async taxCreditsQueue() {
    const rows = await this.taxCredits.listAdmin();
    const remainingCap = rows[0] ? await this.taxCredits.remainingCap(rows[0].programId) : "0.0000";
    return { remainingCap, entitlements: rows };
  }

  @Post("tax-credits/:id/certify")
  @Permissions(Permission.TAX_CREDIT_CERTIFY)
  certify(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.taxCredits.certify(user, id, parse(taxCreditReasonSchema, body));
  }

  @Post("tax-credits/:id/adjust")
  @Permissions(Permission.TAX_CREDIT_CERTIFY)
  adjust(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.taxCredits.adjust(user, id, parse(taxCreditAdjustSchema, body));
  }

  @Post("tax-credits/:id/recapture-review")
  @Permissions(Permission.TAX_CREDIT_CERTIFY)
  recapture(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.admin.recaptureReview(user, id, parse(recaptureReviewSchema, body));
  }

  @Get("investors")
  @Permissions(Permission.INVESTOR_READ)
  investors(@Query("q") q?: string) {
    return this.admin.investors(q);
  }

  @Get("investments")
  @Permissions(Permission.INVESTOR_READ)
  investments(@Query("offeringId") offeringId?: string, @Query("status") status?: string) {
    return this.admin.investments({ offeringId, status });
  }

  @Get("compliance")
  @Permissions(Permission.AUDIT_READ)
  compliance() {
    return this.admin.compliance();
  }

  @Get("audit-events")
  @Permissions(Permission.AUDIT_READ)
  auditEvents(@Query("action") action?: string, @Query("entityType") entityType?: string) {
    return this.admin.auditEvents({ action, entityType });
  }

  @Get("reports")
  @Permissions(Permission.OFFERING_READ)
  @Header("Content-Type", "text/csv")
  async reports() {
    return this.admin.reportsCsv();
  }

  @Get("programs")
  @Permissions(Permission.OFFERING_READ)
  programs() {
    return this.admin.programs();
  }

  @Get("projects")
  @Permissions(Permission.OFFERING_READ)
  projects() {
    return this.impact.managerProjects();
  }

  @Get("impact")
  @Permissions(Permission.OFFERING_READ)
  impactQueue() {
    return this.impact.adminQueue();
  }

  @Post("impact/:reportId/verify")
  @Permissions(Permission.IMPACT_VERIFY)
  verifyImpact(
    @CurrentUser() user: RequestUser,
    @Param("reportId") reportId: string,
    @Body() body: unknown,
  ) {
    return this.impact.decide(user, reportId, "VERIFIED", parse(offeringActionSchema, body));
  }

  @Post("demo/reset")
  @Permissions(Permission.PROGRAM_ADMIN)
  demoReset(@CurrentUser() user: RequestUser) {
    return this.admin.demoReset(user, loadConfig().ALLOW_DEMO_RESET);
  }

  @Post("impact/:reportId/reject")
  @Permissions(Permission.IMPACT_VERIFY)
  rejectImpact(
    @CurrentUser() user: RequestUser,
    @Param("reportId") reportId: string,
    @Body() body: unknown,
  ) {
    return this.impact.decide(user, reportId, "REJECTED", parse(offeringActionSchema, body));
  }
}
