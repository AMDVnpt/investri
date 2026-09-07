import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  investmentQuoteSchema,
  investmentSubmitSchema,
  plaidExchangeSchema,
} from "@investri/validation";
import { AuthGuard } from "../auth/auth.guard";
import { CitizenGuard } from "../auth/citizen.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { InvestmentsService } from "./investments.service";

@Controller("investments")
@UseGuards(AuthGuard, CitizenGuard)
export class InvestmentsController {
  constructor(private readonly investments: InvestmentsService) {}

  @Post("quote")
  quote(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.investments.quote(user, investmentQuoteSchema.parse(body));
  }

  @Post()
  submit(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.investments.submit(user, investmentSubmitSchema.parse(body));
  }

  @Post("funding/plaid/link-token")
  createPlaidLink(@CurrentUser() user: RequestUser) {
    return this.investments.createPlaidLink(user);
  }

  @Post("funding/plaid/exchange")
  exchangePlaid(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.investments.exchangePlaid(user, plaidExchangeSchema.parse(body));
  }

  @Get(":id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.investments.get(user, id);
  }
}
