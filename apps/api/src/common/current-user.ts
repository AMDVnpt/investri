import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  id: string;
  email: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    return ctx.switchToHttp().getRequest().user as RequestUser | undefined;
  },
);
