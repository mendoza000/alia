-- CreateTable
CREATE TABLE "time_off" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_off_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_off_psychologistId_idx" ON "time_off"("psychologistId");

-- AddForeignKey
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "psychologist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
