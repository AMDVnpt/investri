-- AlterEnum
ALTER TYPE "CashFlowType" ADD VALUE 'DISTRIBUTION';

-- CreateTable
CREATE TABLE "Valuation" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "periodLabel" TEXT NOT NULL,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioActivity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "positionId" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorDocument" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "positionId" UUID,
    "category" TEXT NOT NULL,
    "taxYear" INTEGER,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioActivity" ADD CONSTRAINT "PortfolioActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioActivity" ADD CONSTRAINT "PortfolioActivity_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "InvestmentPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
