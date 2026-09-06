import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token =
      (header?.startsWith("Bearer ") ? header.slice(7) : undefined) ??
      (request.cookies?.investri_access as string | undefined);
    if (!token) {
      return true;
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(token);
      request.user = { id: payload.sub, email: payload.email, roles: payload.roles };
    } catch {
      // Public routes still work if a stale token is present.
    }
    return true;
  }
}
