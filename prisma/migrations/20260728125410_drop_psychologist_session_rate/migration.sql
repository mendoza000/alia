-- Pricing is now global (PaymentRate table), not per-psychologist.
ALTER TABLE "psychologist" DROP COLUMN "sessionRate";
