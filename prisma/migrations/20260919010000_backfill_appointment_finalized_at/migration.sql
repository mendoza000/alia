-- Data-only migration, no schema change. `finalizedAt` was added by an
-- earlier migration without a backfill, so any COMPLETED/CANCELLED/NO_SHOW
-- row created before that migration ran still has finalizedAt = NULL. The
-- Fase 6 unpaid-session block (isBlockingUnpaidSession) treats a null
-- finalizedAt defensively as "grace period already elapsed", but this
-- backfill makes that the exception rather than the common case for
-- pre-existing rows.
UPDATE "appointment"
SET "finalizedAt" = "updatedAt"
WHERE "status" IN ('COMPLETED', 'CANCELLED', 'NO_SHOW') AND "finalizedAt" IS NULL;
