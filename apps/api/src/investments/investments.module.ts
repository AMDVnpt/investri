import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OnboardingModule } from "../onboarding/onboarding.module";
import { TaxCreditsModule } from "../tax-credits/tax-credits.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvestmentsController } from "./investments.controller";
import { InvestmentsService } from "./investments.service";

@Module({
  imports: [AuthModule, OnboardingModule, TaxCreditsModule, NotificationsModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
