/**
 * Backfill the real Stripe-settled USD amount for approved payments that
 * predate the balance_transaction integration, and recompute payoutAmountUsd
 * from the real amount. Run once against production after the migration:
 *   bun --env-file=.env run scripts/backfill-stripe-settlement.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getStripeSettlement } from "../src/lib/stripe";

const dbUrl = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const payments = await prisma.payment.findMany({
  where: {
    status: "APPROVED",
    stripePaymentIntentId: { not: null },
    stripeBalanceTransactionId: null,
  },
  select: { id: true, stripePaymentIntentId: true, payoutRatePercent: true },
});

console.log(`Found ${payments.length} approved payments to reconcile with Stripe.`);

let updated = 0;
let skipped = 0;
let failed = 0;

for (const payment of payments) {
  try {
    const settlement = await getStripeSettlement(payment.stripePaymentIntentId as string);
    if (!settlement) {
      console.log(`[SKIP] ${payment.id} — no balance_transaction available yet`);
      skipped++;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSettlementCheckedAt: new Date() },
      });
      continue;
    }

    const payoutAmountUsd =
      payment.payoutRatePercent != null
        ? settlement.settledAmountUsd * (payment.payoutRatePercent / 100)
        : undefined;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeChargeId: settlement.chargeId,
        stripeBalanceTransactionId: settlement.balanceTransactionId,
        stripeSettledAmountUsd: settlement.settledAmountUsd,
        stripeFeeUsd: settlement.feeUsd,
        stripeSettlementRate: settlement.exchangeRate,
        stripeSettlementCheckedAt: new Date(),
        ...(payoutAmountUsd !== undefined ? { payoutAmountUsd } : {}),
      },
    });
    console.log(`[OK] ${payment.id} → US$ ${settlement.settledAmountUsd.toFixed(2)} real`);
    updated++;
  } catch (err) {
    console.log(`[FAIL] ${payment.id} — ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

console.log(`Done. updated=${updated} skipped=${skipped} failed=${failed}`);

await pool.end();
