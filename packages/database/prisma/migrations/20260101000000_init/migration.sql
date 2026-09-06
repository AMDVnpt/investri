-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('CITIZEN_INVESTOR', 'COMMERCE_REVIEWER', 'COMMERCE_PROGRAM_ADMIN', 'COMMERCE_TAX_ADMIN', 'COMPLIANCE_OFFICER', 'FUND_MANAGER', 'FUND_MANAGER_EDITOR', 'AUDITOR_READ_ONLY', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "OfferingFramework" AS ENUM ('REG_CF', 'REG_A_TIER_1', 'REG_A_TIER_2', 'RULE_147', 'RULE_147A', 'REGISTERED_FUND', 'MUNICIPAL_OR_QUASI_PUBLIC', 'OTHER', 'DEMO');

-- CreateEnum
CREATE TYPE "OfferingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'COMMERCE_APPROVED', 'REGULATORY_APPROVED', 'SCHEDULED', 'LIVE', 'PAUSED', 'CLOSED', 'MATURED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentAccessLevel" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'ELIGIBLE_INVESTOR');

-- CreateEnum
CREATE TYPE "TaxCreditProgramStatus" AS ENUM ('PROPOSED', 'ENACTED', 'ACTIVE', 'SUNSET', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VestingMethod" AS ENUM ('IMMEDIATE', 'ANNUAL_EQUAL', 'CUSTOM_SCHEDULE', 'MILESTONE_BASED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PIPELINE', 'ACTIVE', 'COMPLETED', 'DELAYED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "reasonCode" TEXT,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundManager" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditProgram" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "authorityCitation" TEXT,
    "status" "TaxCreditProgramStatus" NOT NULL,
    "creditRate" DECIMAL(8,6) NOT NULL,
    "vestingMethod" "VestingMethod" NOT NULL,
    "carryforwardYears" INTEGER,
    "refundable" BOOLEAN NOT NULL,
    "transferable" BOOLEAN NOT NULL,
    "residencyRequired" BOOLEAN NOT NULL,
    "minimumHoldingPeriodMonths" INTEGER,
    "recaptureEnabled" BOOLEAN NOT NULL,
    "totalProgramCap" DECIMAL(19,4),
    "annualProgramCap" DECIMAL(19,4),
    "disclaimerKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCreditProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditSchedule" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "yearIndex" INTEGER NOT NULL,
    "rate" DECIMAL(8,6) NOT NULL,

    CONSTRAINT "TaxCreditSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offering" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "managerId" UUID NOT NULL,
    "framework" "OfferingFramework" NOT NULL DEFAULT 'DEMO',
    "governingRegulator" TEXT,
    "status" "OfferingStatus" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImageAlt" TEXT,
    "galleryJson" JSONB,
    "minInvestment" DECIMAL(19,4) NOT NULL,
    "maxInvestment" DECIMAL(19,4),
    "targetRaise" DECIMAL(19,4) NOT NULL,
    "raisedAmount" DECIMAL(19,4) NOT NULL,
    "targetReturnLow" DECIMAL(8,6),
    "targetReturnHigh" DECIMAL(8,6),
    "targetTermMonths" INTEGER,
    "liquidityDescription" TEXT NOT NULL,
    "distributionFrequency" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "residentOnly" BOOLEAN NOT NULL DEFAULT true,
    "taxCreditProgramId" UUID,
    "taxFormType" TEXT,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "currentVersionId" UUID,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingVersion" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingTerm" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingFee" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingRisk" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isSummary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingDocument" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accessLevel" "DocumentAccessLevel" NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingAllocation" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" DECIMAL(8,6) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingUpdate" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferingUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingEligibilityRule" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "OfferingEligibilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true,
    "heroImageUrl" TEXT,
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,
    "imageAlt" TEXT,
    "imageCredit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLocation" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "municipality" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'RI',
    "isStatewide" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "ProjectLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvestment" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "amountDeployed" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "ProjectInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetricDefinition" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "ImpactMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetricReport" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "source" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ImpactMetricReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisclosureTemplate" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DisclosureTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisclosureVersion" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisclosureVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Offering_slug_key" ON "Offering"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingVersion_offeringId_version_key" ON "OfferingVersion"("offeringId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactMetricDefinition_key_key" ON "ImpactMetricDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DisclosureTemplate_key_key" ON "DisclosureTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DisclosureVersion_templateId_version_key" ON "DisclosureVersion"("templateId", "version");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCreditSchedule" ADD CONSTRAINT "TaxCreditSchedule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TaxCreditProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "FundManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_taxCreditProgramId_fkey" FOREIGN KEY ("taxCreditProgramId") REFERENCES "TaxCreditProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingVersion" ADD CONSTRAINT "OfferingVersion_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingTerm" ADD CONSTRAINT "OfferingTerm_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingFee" ADD CONSTRAINT "OfferingFee_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRisk" ADD CONSTRAINT "OfferingRisk_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingDocument" ADD CONSTRAINT "OfferingDocument_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingAllocation" ADD CONSTRAINT "OfferingAllocation_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingUpdate" ADD CONSTRAINT "OfferingUpdate_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingEligibilityRule" ADD CONSTRAINT "OfferingEligibilityRule_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLocation" ADD CONSTRAINT "ProjectLocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvestment" ADD CONSTRAINT "ProjectInvestment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvestment" ADD CONSTRAINT "ProjectInvestment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactMetricReport" ADD CONSTRAINT "ImpactMetricReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactMetricReport" ADD CONSTRAINT "ImpactMetricReport_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ImpactMetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisclosureVersion" ADD CONSTRAINT "DisclosureVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DisclosureTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

