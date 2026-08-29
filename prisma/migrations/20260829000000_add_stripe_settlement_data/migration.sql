-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeBalanceTransactionId" TEXT,
ADD COLUMN     "stripeSettledAmountUsd" DOUBLE PRECISION,
ADD COLUMN     "stripeFeeUsd" DOUBLE PRECISION,
ADD COLUMN     "stripeSettlementRate" DOUBLE PRECISION,
ADD COLUMN     "stripeSettlementCheckedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeChargeId_key" ON "payment"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeBalanceTransactionId_key" ON "payment"("stripeBalanceTransactionId");
