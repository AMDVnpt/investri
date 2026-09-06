import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { prisma } from "@investri/database";
import { illustrateTaxCredit, moneyString } from "@investri/domain";

@Controller("tax-credit-programs")
export class TaxCreditsController {
  @Get(":id")
  async get(@Param("id") id: string) {
    const program = await prisma.taxCreditProgram.findUnique({
      where: { id },
      include: { schedules: { orderBy: { yearIndex: "asc" } } },
    });
    if (!program) {
      throw new NotFoundException("Tax-credit program not found");
    }
    const illustration = illustrateTaxCredit("1000", program.creditRate.toString());
    return {
      id: program.id,
      name: program.name,
      authorityCitation: program.authorityCitation,
      status: program.status,
      creditRate: moneyString(program.creditRate.toString(), 6),
      vestingMethod: program.vestingMethod,
      carryforwardYears: program.carryforwardYears,
      refundable: program.refundable,
      transferable: program.transferable,
      residencyRequired: program.residencyRequired,
      minimumHoldingPeriodMonths: program.minimumHoldingPeriodMonths,
      recaptureEnabled: program.recaptureEnabled,
      disclaimerKey: program.disclaimerKey,
      schedules: program.schedules.map((row) => ({
        yearIndex: row.yearIndex,
        rate: moneyString(row.rate.toString(), 6),
      })),
      illustration: {
        ...illustration,
        label: "Illustrative example only",
        notEnacted: program.status === "PROPOSED",
        notInvestmentReturn: true,
        copy: "A $1,000 qualifying investment could be eligible for up to $200 of Rhode Island tax credits under the current program configuration. This is not cash back. You have not received a credit.",
      },
    };
  }
}
