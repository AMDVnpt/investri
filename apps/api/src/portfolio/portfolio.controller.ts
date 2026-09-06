import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CitizenGuard } from "../auth/citizen.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { PortfolioService } from "./portfolio.service";

@Controller()
@UseGuards(AuthGuard, CitizenGuard)
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get("portfolio")
  summary(@CurrentUser() user: RequestUser) {
    return this.portfolio.summary(user);
  }

  @Get("portfolio/positions/:id")
  position(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.portfolio.position(user, id);
  }

  @Get("documents")
  documents(
    @CurrentUser() user: RequestUser,
    @Query() query: { taxYear?: string; positionId?: string; category?: string },
  ) {
    return this.portfolio.documents(user, query);
  }
}
