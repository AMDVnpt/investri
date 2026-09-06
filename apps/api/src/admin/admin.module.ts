import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuthModule } from "../auth/auth.module";
import { TaxCreditsModule } from "../tax-credits/tax-credits.module";
import { ImpactModule } from "../impact/impact.module";

@Module({
  imports: [AuthModule, TaxCreditsModule, ImpactModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
