import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { offeringListQuerySchema } from "@investri/validation";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, type RequestUser } from "../common/current-user";

@Controller("offerings")
export class OfferingsController {
  constructor(private readonly offerings: OfferingsService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    return this.offerings.list(offeringListQuerySchema.parse(query));
  }

  @Get(":idOrSlug")
  @UseGuards(OptionalAuthGuard)
  detail(@Param("idOrSlug") idOrSlug: string, @CurrentUser() user?: RequestUser) {
    return this.offerings.detail(idOrSlug, Boolean(user));
  }

  @Get(":id/documents")
  @UseGuards(OptionalAuthGuard)
  documents(@Param("id") id: string, @CurrentUser() user?: RequestUser) {
    return this.offerings.documents(id, Boolean(user));
  }

  @Get(":id/documents/:docId")
  @UseGuards(OptionalAuthGuard)
  document(
    @Param("id") id: string,
    @Param("docId") docId: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.offerings.document(id, docId, Boolean(user));
  }

  @Get(":id/risks")
  @UseGuards(OptionalAuthGuard)
  risks(@Param("id") id: string, @CurrentUser() user?: RequestUser) {
    return this.offerings.risks(id, Boolean(user));
  }

  @Get(":id/fees")
  fees(@Param("id") id: string) {
    return this.offerings.fees(id);
  }

  @Get(":id/allocations")
  allocations(@Param("id") id: string) {
    return this.offerings.allocations(id);
  }

  @Get(":id/projects")
  projects(@Param("id") id: string) {
    return this.offerings.projects(id);
  }

  @Get(":id/updates")
  @UseGuards(AuthGuard)
  updates(@Param("id") id: string) {
    return this.offerings.updates(id);
  }
}
