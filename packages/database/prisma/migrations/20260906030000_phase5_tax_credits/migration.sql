-- AlterTable
ALTER TABLE "TaxCreditProgram" ADD COLUMN "effectiveDate" TIMESTAMP(3);
ALTER TABLE "TaxCreditProgram" ADD COLUMN "sunsetDate" TIMESTAMP(3);
ALTER TABLE "TaxCreditProgram" ADD COLUMN "eligibleTaxTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ProgramCap" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "year" INTEGER,
    "authorizedAmount" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "ProgramCap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCapLedger" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "offeringId" UUID,
    "entitlementId" UUID,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCapLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditEntitlement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "qualifiedBasis" DECIMAL(19,4) NOT NULL,
    "potentialCredit" DECIMAL(19,4) NOT NULL,
    "earnedCredit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "certifiedCredit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "claimedCredit" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCreditEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditVestingEvent" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "yearIndex" INTEGER NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "vestsOn" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TaxCreditVestingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditCertificate" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "certifiedAmount" DECIMAL(19,4) NOT NULL,
    "availableAmount" DECIMAL(19,4) NOT NULL,
    "claimedAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "carryforwardExpiresOn" TIMESTAMP(3),
    "documentId" UUID,
    "commerceApprovedBy" TEXT,
    "supersedesCertificateId" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationCode" TEXT NOT NULL,

    CONSTRAINT "TaxCreditCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditAdjustment" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCreditAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCreditRecaptureCase" (
    "id" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCreditRecaptureCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCapLedger_idempotencyKey_key" ON "ProgramCapLedger"("idempotencyKey");
CREATE UNIQUE INDEX "TaxCreditEntitlement_positionId_key" ON "TaxCreditEntitlement"("positionId");
CREATE UNIQUE INDEX "TaxCreditCertificate_number_key" ON "TaxCreditCertificate"("number");
CREATE UNIQUE INDEX "TaxCreditCertificate_documentId_key" ON "TaxCreditCertificate"("documentId");

-- AddForeignKey
ALTER TABLE "ProgramCap" ADD CONSTRAINT "ProgramCap_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TaxCreditProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgramCapLedger" ADD CONSTRAINT "ProgramCapLedger_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TaxCreditProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditEntitlement" ADD CONSTRAINT "TaxCreditEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditEntitlement" ADD CONSTRAINT "TaxCreditEntitlement_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditEntitlement" ADD CONSTRAINT "TaxCreditEntitlement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TaxCreditProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditVestingEvent" ADD CONSTRAINT "TaxCreditVestingEvent_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "TaxCreditEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditCertificate" ADD CONSTRAINT "TaxCreditCertificate_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "TaxCreditEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditCertificate" ADD CONSTRAINT "TaxCreditCertificate_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "InvestorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxCreditAdjustment" ADD CONSTRAINT "TaxCreditAdjustment_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "TaxCreditEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxCreditRecaptureCase" ADD CONSTRAINT "TaxCreditRecaptureCase_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "TaxCreditEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
