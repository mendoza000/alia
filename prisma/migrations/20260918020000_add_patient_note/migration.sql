-- CreateTable
CREATE TABLE "patient_note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_note_userId_idx" ON "patient_note"("userId");

-- AddForeignKey
ALTER TABLE "patient_note" ADD CONSTRAINT "patient_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_note" ADD CONSTRAINT "patient_note_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "psychologist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
