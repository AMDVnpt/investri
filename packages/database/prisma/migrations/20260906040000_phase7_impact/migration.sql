-- CreateEnum
CREATE TYPE "ImpactVerificationStatus" AS ENUM ('SELF_REPORTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "useOfCapital" TEXT;
ALTER TABLE "Project" ADD COLUMN "capitalStackJson" JSONB;

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ImpactMetricReport" ADD COLUMN "verificationStatus" "ImpactVerificationStatus" NOT NULL DEFAULT 'SELF_REPORTED';
UPDATE "ImpactMetricReport" SET "verificationStatus" = CASE WHEN "verified" THEN 'VERIFIED'::"ImpactVerificationStatus" ELSE 'SELF_REPORTED'::"ImpactVerificationStatus" END;
ALTER TABLE "ImpactMetricReport" DROP COLUMN "verified";

-- CreateTable
CREATE TABLE "ImpactEvidence" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ImpactEvidence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImpactEvidence" ADD CONSTRAINT "ImpactEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ImpactMetricReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
