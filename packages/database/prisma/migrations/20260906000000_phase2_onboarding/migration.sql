-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'passed', 'failed');

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "legalFirstName" TEXT NOT NULL,
    "legalLastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "phone" TEXT,
    "citizenship" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "occupation" TEXT,
    "experienceBand" TEXT NOT NULL,
    "incomeRange" TEXT NOT NULL,
    "netWorthRange" TEXT NOT NULL,
    "accredited" BOOLEAN NOT NULL DEFAULT false,
    "canBearLoss" BOOLEAN NOT NULL,
    "acceptsIlliquidity" BOOLEAN NOT NULL,
    "trustedContactName" TEXT,
    "trustedContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "applicantId" TEXT NOT NULL,
    "providerToken" TEXT NOT NULL,
    "ssnLastFour" TEXT,
    "legalFirstName" TEXT NOT NULL,
    "legalLastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "phone" TEXT,
    "status" "VerificationStatus" NOT NULL,
    "lastErrorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidencyVerification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "attestedRiResident" BOOLEAN NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "lastErrorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidencyVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorEligibility" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "suitable" BOOLEAN NOT NULL,
    "accredited" BOOLEAN NOT NULL,
    "residentQualified" BOOLEAN NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorAcknowledgement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "disclosureVersionId" UUID NOT NULL,
    "offeringId" UUID,
    "scopeKey" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_userId_key" ON "IdentityVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidencyVerification_userId_key" ON "ResidencyVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorEligibility_userId_key" ON "InvestorEligibility"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorAcknowledgement_userId_disclosureVersionId_scopeKey_key" ON "InvestorAcknowledgement"("userId", "disclosureVersionId", "scopeKey");

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidencyVerification" ADD CONSTRAINT "ResidencyVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorEligibility" ADD CONSTRAINT "InvestorEligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorAcknowledgement" ADD CONSTRAINT "InvestorAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorAcknowledgement" ADD CONSTRAINT "InvestorAcknowledgement_disclosureVersionId_fkey" FOREIGN KEY ("disclosureVersionId") REFERENCES "DisclosureVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorAcknowledgement" ADD CONSTRAINT "InvestorAcknowledgement_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
