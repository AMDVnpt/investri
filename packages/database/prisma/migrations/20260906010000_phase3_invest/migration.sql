-- CreateEnum
CREATE TYPE "InvestmentOrderStatus" AS ENUM ('QUOTED', 'LIMIT_FAILED', 'AWAITING_FUNDING', 'AWAITING_SIGNATURE', 'SUBMITTED', 'COMPLIANCE_REVIEW', 'FUNDING_PENDING', 'SETTLED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('CONTRIBUTION', 'FEE');

-- CreateTable
CREATE TABLE "InvestorAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentOrder" (
    "id" UUID NOT NULL,
    "investorAccountId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestedAmount" DECIMAL(19,4) NOT NULL,
    "feeAmount" DECIMAL(19,4) NOT NULL,
    "status" "InvestmentOrderStatus" NOT NULL,
    "brokerageOrderId" TEXT,
    "fundingTransferId" TEXT,
    "envelopeId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentSubscription" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "offeringVersion" INTEGER NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPosition" (
    "id" UUID NOT NULL,
    "investorAccountId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "settledAmount" DECIMAL(19,4) NOT NULL,
    "costBasis" DECIMAL(19,4) NOT NULL,
    "currentValue" DECIMAL(19,4) NOT NULL,
    "totalDistributions" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentCashFlow" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "InvestmentCashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorAccount_userId_key" ON "InvestorAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentOrder_idempotencyKey_key" ON "InvestmentOrder"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentSubscription_orderId_key" ON "InvestmentSubscription"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentPosition_orderId_key" ON "InvestmentPosition"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentCashFlow_positionId_type_idempotencyKey_key" ON "InvestmentCashFlow"("positionId", "type", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "InvestorAccount" ADD CONSTRAINT "InvestorAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentOrder" ADD CONSTRAINT "InvestmentOrder_investorAccountId_fkey" FOREIGN KEY ("investorAccountId") REFERENCES "InvestorAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentOrder" ADD CONSTRAINT "InvestmentOrder_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentSubscription" ADD CONSTRAINT "InvestmentSubscription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InvestmentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_investorAccountId_fkey" FOREIGN KEY ("investorAccountId") REFERENCES "InvestorAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "InvestmentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentCashFlow" ADD CONSTRAINT "InvestmentCashFlow_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
