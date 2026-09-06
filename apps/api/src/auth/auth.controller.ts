import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "@investri/validation";
import { AuthGuard } from "./auth.guard";
import { CurrentUser } from "../common/current-user";
import { loadConfig } from "@investri/config";

const config = loadConfig();

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie("investri_refresh", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.COOKIE_SECURE,
    expires: expiresAt,
    path: "/",
  });
  res.cookie("investri_access", "", { httpOnly: true, expires: new Date(0), path: "/" });
}

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("auth/register")
  async register(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = registerSchema.parse(body);
    const tokens = await this.auth.register(input);
    this.attach(req, res, tokens);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user };
  }

  @Post("auth/login")
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = loginSchema.parse(body);
    const tokens = await this.auth.login(input.email, input.password, req.headers["user-agent"]);
    this.attach(req, res, tokens);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user };
  }

  @Post("auth/refresh")
  async refresh(@Body() body: { refreshToken?: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = body.refreshToken ?? (req.cookies?.investri_refresh as string | undefined);
    const tokens = await this.auth.refresh(token ?? "");
    this.attach(req, res, tokens);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user };
  }

  @Post("auth/logout")
  async logout(@Body() body: { refreshToken?: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(body.refreshToken ?? (req.cookies?.investri_refresh as string | undefined));
    res.clearCookie("investri_refresh", { path: "/" });
    res.clearCookie("investri_access", { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.getUser(user.id);
  }

  private attach(
    req: Request,
    res: Response,
    tokens: { accessToken: string; refreshToken: string; expiresAt: Date },
  ) {
    if (req.headers["x-client"] === "web") {
      setRefreshCookie(res, tokens.refreshToken, tokens.expiresAt);
      res.cookie("investri_access", tokens.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.COOKIE_SECURE,
        maxAge: 15 * 60 * 1000,
        path: "/",
      });
    }
  }
}
