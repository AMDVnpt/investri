import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.readToken(request);
    if (!token) {
      throw new UnauthorizedException("Sign in required");
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(token);
      request.user = { id: payload.sub, email: payload.email, roles: payload.roles };
      return true;
    } catch {
      throw new UnauthorizedException("Session expired");
    }
  }

  private readToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice(7);
    }
    return (request.cookies?.investri_access as string | undefined) ?? undefined;
  }
}
