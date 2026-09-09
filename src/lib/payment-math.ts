// Pure currency/payment math — no database or Node-only imports, so this
// module is safe to import from client components (unlike exchange-rates.ts,
// which pulls in prisma/pg for its rate-fetching functions).

// Every USD amount gets rounded to the cent right where it's computed, and
// totals sum those already-rounded cents as integers — so a total always
// equals the exact sum of the per-row amounts a human sees on screen, with
// no float-precision drift creeping in.
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function sumUsd(amounts: Array<number | null | undefined>): number {
  const totalCents = amounts.reduce<number>(
    (cents, amount) => cents + Math.round((amount ?? 0) * 100),
    0,
  );
  return totalCents / 100;
}

export function toUsd(
  amount: number,
  currency: string,
  rates: Map<string, number>,
): number {
  const rate = rates.get(currency.toUpperCase());
  if (!rate) return 0;
  return amount / rate;
}

/**
 * Converts a payment's amount to USD using the exchange rate frozen at
 * the moment it was approved (`exchangeRateToUsd`). Falls back to the
 * live rate map only for payments approved before that field existed.
 */
export function paymentToUsd(
  amount: number,
  currency: string,
  exchangeRateToUsd: number | null,
  liveRates: Map<string, number>,
): number {
  const rate = exchangeRateToUsd ?? liveRates.get(currency.toUpperCase());
  if (!rate) return 0;
  return roundToCents(amount / rate);
}

/**
 * Prefers the amount Stripe actually settled (`stripeSettledAmountUsd`) over
 * our own mid-market estimate, since Stripe's own conversion rate — which
 * includes its FX spread — is what really lands in the account.
 */
export function getPaymentAmountUsd(
  payment: {
    finalAmount: number;
    currency: string;
    exchangeRateToUsd: number | null;
    stripeSettledAmountUsd: number | null;
  },
  liveRates: Map<string, number>,
): number {
  if (payment.stripeSettledAmountUsd != null) {
    return roundToCents(payment.stripeSettledAmountUsd);
  }
  return paymentToUsd(
    payment.finalAmount,
    payment.currency,
    payment.exchangeRateToUsd,
    liveRates,
  );
}

/**
 * The psychologist's cut of a payment, in USD. Prefers the frozen
 * `payoutAmountUsd` (set once the commission is applied); falls back to
 * computing it from `payoutRatePercent` for a payment where the fixed
 * amount hasn't been recorded yet. Shared by row display and aggregate
 * totals so a row that shows a dollar amount always counts toward the sum.
 */
export function getPsychologistShareUsd(
  payment: { payoutAmountUsd: number | null; payoutRatePercent: number | null },
  finalAmountUsd: number,
): number | null {
  if (payment.payoutAmountUsd != null) return roundToCents(payment.payoutAmountUsd);
  if (payment.payoutRatePercent != null) {
    return roundToCents(finalAmountUsd * (payment.payoutRatePercent / 100));
  }
  return null;
}
