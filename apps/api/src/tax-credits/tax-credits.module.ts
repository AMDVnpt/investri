import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TaxCreditsController } from "./tax-credits.controller";
import { TaxCreditEngineService } from "./tax-credit-engine.service";
import { CitizenTaxCreditsController } from "./citizen-tax-credits.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [TaxCreditsController, CitizenTaxCreditsController],
  providers: [TaxCreditEngineService],
  exports: [TaxCreditEngineService],
})
export class TaxCreditsModule {}
