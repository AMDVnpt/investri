import { Module } from "@nestjs/common";
import { DisclosuresController } from "./disclosures.controller";

@Module({
  controllers: [DisclosuresController],
})
export class DisclosuresModule {}
