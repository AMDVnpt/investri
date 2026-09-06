import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ImpactController } from "./impact.controller";
import { ManagerImpactController } from "./manager-impact.controller";
import { ImpactService } from "./impact.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ImpactController, ManagerImpactController],
  providers: [ImpactService],
  exports: [ImpactService],
})
export class ImpactModule {}
