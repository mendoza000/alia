-- Deduplicate IntakeForm rows before enforcing one-per-patient
-- 1. Backup rows that will be removed (audit trail, safe to drop later once verified)
CREATE TABLE IF NOT EXISTS "_intake_form_dedup_backup" AS
SELECT *
FROM "intake_form" f
WHERE f.id NOT IN (
  SELECT DISTINCT ON ("userId") id
  FROM "intake_form"
  ORDER BY "userId", "createdAt" DESC, "id" DESC
);

-- 2. Carry forward clinicalDataRedactedAt from older duplicates into the row we keep,
--    so an already-applied redaction is never lost
UPDATE "intake_form" winner
SET "clinicalDataRedactedAt" = dup."clinicalDataRedactedAt"
FROM "intake_form" dup
WHERE winner.id = (
    SELECT DISTINCT ON ("userId") id
    FROM "intake_form" f2
    WHERE f2."userId" = winner."userId"
    ORDER BY f2."userId", f2."createdAt" DESC, f2."id" DESC
  )
  AND dup."userId" = winner."userId"
  AND dup.id <> winner.id
  AND dup."clinicalDataRedactedAt" IS NOT NULL
  AND winner."clinicalDataRedactedAt" IS NULL;

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "timezone" TEXT;

-- 3. Backfill appointment.timezone from whichever intake form (duplicate or not) was
--    filled for that appointment, before the duplicates are deleted below
UPDATE "appointment" a
SET "timezone" = f.data ->> 'timezone'
FROM "intake_form" f
WHERE a.id = f."appointmentId"
  AND f.data ? 'timezone';

-- 4. Delete duplicate intake forms, keeping only the most recent one per patient
DELETE FROM "intake_form" f
WHERE f.id NOT IN (
  SELECT DISTINCT ON ("userId") id
  FROM "intake_form"
  ORDER BY "userId", "createdAt" DESC, "id" DESC
);

-- DropIndex
DROP INDEX "intake_form_userId_idx";

-- AlterTable: appointmentId becomes an optional historical reference instead of the
-- required 1:1 owner of the form; userId becomes the unique owner (one form per patient)
ALTER TABLE "intake_form" DROP CONSTRAINT "intake_form_appointmentId_fkey";

ALTER TABLE "intake_form" ALTER COLUMN "appointmentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "intake_form_userId_key" ON "intake_form"("userId");

-- AddForeignKey
ALTER TABLE "intake_form" ADD CONSTRAINT "intake_form_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
