-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('CUSTOM_PAYMENT_AMOUNT', 'REFUND_REQUEST');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING_EXECUTION', 'EXECUTED');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "refundStatus" "RefundStatus";

-- CreateTable
CREATE TABLE "approval_request" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_request_requestedByUserId_idx" ON "approval_request"("requestedByUserId");

-- CreateIndex
CREATE INDEX "approval_request_status_idx" ON "approval_request"("status");

-- CreateIndex
CREATE INDEX "approval_request_targetId_idx" ON "approval_request"("targetId");

-- AddForeignKey
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
