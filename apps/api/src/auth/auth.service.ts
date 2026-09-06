import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@investri/database";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { loadConfig } from "@investri/config";
import { RoleName, deriveOnboardingStatus, ONBOARDING_DISCLOSURE_KEYS } from "@investri/domain";
import type { RequestUser } from "../common/current-user";

const config = loadConfig();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException("An account with that email already exists");
    }
    const citizen = await prisma.role.findUniqueOrThrow({
      where: { name: RoleName.CITIZEN_INVESTOR },
    });
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 10),
        firstName: input.firstName,
        lastName: input.lastName,
        roles: { create: { roleId: citizen.id } },
      },
    });
    return this.issueTokens(user.id);
  }

  async login(email: string, password: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(user.id, userAgent);
  }

  async issueTokens(userId: string, userAgent?: string) {
    const user = await this.getUser(userId);
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt,
        userAgent,
      },
    });
    return { accessToken, refreshToken, user, expiresAt };
  }

  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(refreshToken) },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired");
    }
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(session.userId, session.userAgent ?? undefined);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { ok: true };
    }
    await prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(refreshToken) },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async getUser(
    userId: string,
  ): Promise<
    RequestUser & {
      firstName: string;
      lastName: string;
      onboardingStatus: string;
      eligibleToInvest: boolean;
    }
  > {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        identityVerification: true,
        residencyVerification: true,
        investorProfile: true,
        investorEligibility: true,
        acknowledgements: { include: { disclosureVersion: { include: { template: true } } } },
      },
    });
    const derived = deriveOnboardingStatus({
      identity: user.identityVerification
        ? {
            status: user.identityVerification.status,
            lastErrorReason: user.identityVerification.lastErrorReason,
          }
        : null,
      residency: user.residencyVerification
        ? {
            status: user.residencyVerification.status,
            lastErrorReason: user.residencyVerification.lastErrorReason,
          }
        : null,
      profile: user.investorProfile ? { exists: true } : null,
      eligibility: user.investorEligibility
        ? {
            status: user.investorEligibility.status,
            suitable: user.investorEligibility.suitable,
            residentQualified: user.investorEligibility.residentQualified,
            reasonCode: user.investorEligibility.reasonCode,
          }
        : null,
      acknowledgedKeys: user.acknowledgements.map((row) => row.disclosureVersion.template.key),
      requiredKeys: ONBOARDING_DISCLOSURE_KEYS,
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((assignment) => assignment.role.name),
      onboardingStatus: derived.status,
      eligibleToInvest: derived.eligibleToInvest,
    };
  }
}

export { config };
