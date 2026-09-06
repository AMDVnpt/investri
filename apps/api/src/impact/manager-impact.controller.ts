import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Permissions } from "../auth/permissions.decorator";
import { Permission } from "@investri/domain";
import { impactSubmitSchema } from "@investri/validation";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { ImpactService } from "./impact.service";

@Controller("manager")
@UseGuards(AuthGuard, RolesGuard)
export class ManagerImpactController {
  constructor(private readonly impact: ImpactService) {}

  @Get("projects")
  @Permissions(Permission.MANAGER_WRITE)
  list() {
    return this.impact.managerProjects();
  }

  @Post("projects/:id/impact")
  @Permissions(Permission.MANAGER_WRITE)
  submit(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.impact.submit(user, id, impactSubmitSchema.parse(body));
  }
}
