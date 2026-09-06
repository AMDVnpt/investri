import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  acknowledgementsSchema,
  identitySchema,
  investorProfileSchema,
  residencySchema,
} from "@investri/validation";
import { AuthGuard } from "../auth/auth.guard";
import { CitizenGuard } from "../auth/citizen.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";
import { OnboardingService } from "./onboarding.service";

@Controller()
@UseGuards(AuthGuard, CitizenGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("onboarding/status")
  status(@CurrentUser() user: RequestUser) {
    return this.onboarding.getStatus(user);
  }

  @Post("onboarding/identity")
  identity(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.onboarding.submitIdentity(user, identitySchema.parse(body));
  }

  @Post("onboarding/residency")
  residency(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.onboarding.submitResidency(user, residencySchema.parse(body));
  }

  @Post("investor-profile")
  profile(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.onboarding.submitProfile(user, investorProfileSchema.parse(body));
  }

  @Post("onboarding/acknowledgements")
  acknowledgements(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.onboarding.submitAcknowledgements(user, acknowledgementsSchema.parse(body));
  }
}
