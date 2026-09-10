-- AlterTable
ALTER TABLE "psychologist" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "psychologist_userId_key" ON "psychologist"("userId");
