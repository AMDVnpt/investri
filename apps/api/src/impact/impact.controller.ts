import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { ImpactService } from "./impact.service";

@Controller()
export class ImpactController {
  constructor(private readonly impact: ImpactService) {}

  @Get("impact")
  @UseGuards(OptionalAuthGuard)
  summary(@CurrentUser() user?: RequestUser) {
    return this.impact.summary(user);
  }

  @Get("projects/:id")
  project(@Param("id") id: string) {
    return this.impact.project(id);
  }
}
