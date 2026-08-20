-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "isFirstAppointment" BOOLEAN,
ADD COLUMN     "payoutAmountUsd" DOUBLE PRECISION,
ADD COLUMN     "payoutRatePercent" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "payout_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "newClientRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 27,
    "recurringClientRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 54,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_settings_pkey" PRIMARY KEY ("id")
);
