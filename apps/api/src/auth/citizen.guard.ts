import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { RoleName } from "@investri/domain";
import type { RequestUser } from "../common/current-user";

@Injectable()
export class CitizenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as RequestUser | undefined;
    if (!user?.roles.includes(RoleName.CITIZEN_INVESTOR)) {
      throw new ForbiddenException("Citizen investors only");
    }
    return true;
  }
}
