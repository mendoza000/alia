-- CreateTable
CREATE TABLE "exchange_rate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rateToUsd" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rate_currency_key" ON "exchange_rate"("currency");
