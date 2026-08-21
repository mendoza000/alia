-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('RECURRING', 'NEW', 'LOYAL', 'LOYAL_NEW');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "payoutType" "PayoutType";

-- AlterTable
ALTER TABLE "payout_settings" ADD COLUMN     "loyalNewRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 27,
ADD COLUMN     "loyalRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 54;
