-- Backfill: no more pre-session payment gate, PENDING_PAYMENT rows become CONFIRMED
-- (must run before the enum is altered, or the cast below fails on any remaining row)
UPDATE "appointment" SET "status" = 'CONFIRMED' WHERE "status" = 'PENDING_PAYMENT';

-- AlterEnum: drop PENDING_PAYMENT from AppointmentStatus
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_FORM', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
ALTER TABLE "appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "appointment" ALTER COLUMN "status" TYPE "AppointmentStatus" USING ("status"::text::"AppointmentStatus");
ALTER TABLE "appointment" ALTER COLUMN "status" SET DEFAULT 'PENDING_FORM';
DROP TYPE "AppointmentStatus_old";

-- AlterTable: appointment.patientCountry
ALTER TABLE "appointment" ADD COLUMN "patientCountry" TEXT;

-- AlterTable: payment — Wompi -> Stripe fields
ALTER TABLE "payment" RENAME COLUMN "wompiTransactionId" TO "stripeCheckoutSessionId";
ALTER INDEX "payment_wompiTransactionId_key" RENAME TO "payment_stripeCheckoutSessionId_key";
ALTER TABLE "payment" ADD COLUMN "stripeCheckoutUrl" TEXT;
ALTER TABLE "payment" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'COP';

CREATE UNIQUE INDEX "payment_stripePaymentIntentId_key" ON "payment"("stripePaymentIntentId");

-- CreateTable: payment_rate (global rates by currency)
CREATE TABLE "payment_rate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_rate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_rate_currency_key" ON "payment_rate"("currency");
