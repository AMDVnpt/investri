import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, type Permission } from "@investri/domain";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import type { RequestUser } from "../common/current-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const user = context.switchToHttp().getRequest().user as RequestUser | undefined;
    if (!user || !required.every((permission) => hasPermission(user.roles, permission))) {
      throw new ForbiddenException("You do not have permission to perform this action");
    }
    return true;
  }
}
