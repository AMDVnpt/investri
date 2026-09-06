import { Module } from "@nestjs/common";
import { OfferingsController } from "./offerings.controller";
import { OfferingsService } from "./offerings.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [OfferingsController],
  providers: [OfferingsService],
})
export class OfferingsModule {}
