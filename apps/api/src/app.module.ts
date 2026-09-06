import "./env";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { OfferingsModule } from "./offerings/offerings.module";
import { TaxCreditsModule } from "./tax-credits/tax-credits.module";
import { DisclosuresModule } from "./disclosures/disclosures.module";
import { AdminModule } from "./admin/admin.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { InvestmentsModule } from "./investments/investments.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ImpactModule } from "./impact/impact.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthController } from "./health/health.controller";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DecimalInterceptor } from "./common/decimal.interceptor";

@Module({
  imports: [
    AuthModule,
    OfferingsModule,
    TaxCreditsModule,
    DisclosuresModule,
    AdminModule,
    OnboardingModule,
    InvestmentsModule,
    PortfolioModule,
    ImpactModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DecimalInterceptor,
    },
  ],
})
export class AppModule {}
