-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "finalizedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "intake_form" ADD COLUMN     "clinicalDataConsentAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "clinicalDataConsentVersion" TEXT,
ADD COLUMN     "clinicalDataRedactedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "appointment_status_finalizedAt_idx" ON "appointment"("status", "finalizedAt");
