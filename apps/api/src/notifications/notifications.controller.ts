import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CitizenGuard } from "../auth/citizen.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(AuthGuard, CitizenGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("preferences")
  preferences(@CurrentUser() user: RequestUser) {
    return this.notifications.preferences(user.id);
  }

  @Patch("preferences")
  updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() body: { pushEnabled?: boolean; emailEnabled?: boolean; smsEnabled?: boolean },
  ) {
    return this.notifications.updatePreferences(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.list(user.id);
  }

  @Post("read-all")
  readAll(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post(":id/read")
  read(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
