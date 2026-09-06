import "../env";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { CitizenGuard } from "./citizen.guard";
import { OptionalAuthGuard } from "./optional-auth.guard";
import { loadConfig } from "@investri/config";
import { PrismaAuditSink } from "../providers/audit.sink";
import { PROVIDERS } from "../providers/providers.token";
import { createProviders } from "@investri/providers";

const config = loadConfig();

@Module({
  imports: [
    JwtModule.register({
      secret: config.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: config.JWT_ACCESS_TTL as `${number}m` | `${number}d` },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    RolesGuard,
    CitizenGuard,
    OptionalAuthGuard,
    PrismaAuditSink,
    {
      provide: PROVIDERS,
      useFactory: (audit: PrismaAuditSink) => createProviders(config, audit),
      inject: [PrismaAuditSink],
    },
  ],
  exports: [AuthService, AuthGuard, RolesGuard, CitizenGuard, OptionalAuthGuard, JwtModule, PROVIDERS],
})
export class AuthModule {}
