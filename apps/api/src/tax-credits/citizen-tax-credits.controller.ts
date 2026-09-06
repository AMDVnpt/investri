import { Controller, Get, Header, Param, StreamableFile, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CitizenGuard } from "../auth/citizen.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { TaxCreditEngineService } from "./tax-credit-engine.service";
import { prisma } from "@investri/database";

@Controller("tax-credits")
@UseGuards(AuthGuard, CitizenGuard)
export class CitizenTaxCreditsController {
  constructor(private readonly engine: TaxCreditEngineService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.engine.listForUser(user.id);
  }

  @Get(":id/certificate")
  @Header("Content-Type", "text/plain")
  async certificate(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    const detail = await this.engine.getForUser(user.id, id);
    const cert = detail.certificates[0];
    const userRow = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const pdf = this.engine.certificatePdf({
      number: cert?.number ?? "PENDING",
      taxpayerName: `${userRow.firstName} ${userRow.lastName}`,
      taxYear: cert?.taxYear ?? new Date().getUTCFullYear(),
      offeringName: detail.offeringName,
      certifiedAmount: detail.buckets.certified,
      issueDate: new Date().toISOString().slice(0, 10),
      carryforwardYears: 5,
      approverId: "commerce",
      validationCode: "demo",
    });
    return new StreamableFile(pdf);
  }

  @Get(":id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.engine.getForUser(user.id, id);
  }
}
