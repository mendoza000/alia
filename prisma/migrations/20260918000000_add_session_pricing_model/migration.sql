-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('INDIVIDUAL', 'COUPLE');

-- CreateEnum
CREATE TYPE "RateKind" AS ENUM ('INDIVIDUAL', 'COUPLE', 'NO_SHOW_FEE');

-- AlterTable: psychologist
ALTER TABLE "psychologist"
    ADD COLUMN "offeredSessionTypes" "SessionType"[] NOT NULL DEFAULT ARRAY['INDIVIDUAL']::"SessionType"[],
    ADD COLUMN "coupleSessionDuration" INTEGER NOT NULL DEFAULT 120;

-- AlterTable: appointment
ALTER TABLE "appointment"
    ADD COLUMN "sessionType" "SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN "agreedAmount" INTEGER,
    ADD COLUMN "agreedCurrency" TEXT,
    ADD COLUMN "agreedPayoutType" "PayoutType";

-- AlterTable: payment
ALTER TABLE "payment"
    ADD COLUMN "isNoShowFee" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: payment_rate — drop whatever the existing single-column unique
-- constraint on "currency" is actually named (found dynamically instead of
-- assumed, since it predates this migration) before adding "kind" and the
-- new compound uniqueness.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payment_rate'::regclass
      AND contype = 'u';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "payment_rate" DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE "payment_rate"
    ADD COLUMN "kind" "RateKind" NOT NULL DEFAULT 'INDIVIDUAL';

CREATE UNIQUE INDEX "payment_rate_currency_kind_key" ON "payment_rate"("currency", "kind");
