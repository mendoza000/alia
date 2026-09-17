/**
 * Pure amount/kind/commission resolution for a session charge. No DB, no
 * "use server" — same shape as payment-math.ts/payout-type.ts. The
 * DB-coupled caller (resolveCheckoutUrl in payment-actions.ts) fetches the
 * appointment/rate/settings and hands the raw values here.
 */
import type {
    PayoutType,
    RateKind,
    SessionType,
} from "@/generated/prisma/enums";

export function sessionTypeToRateKind(sessionType: SessionType): RateKind {
    return sessionType === "COUPLE" ? "COUPLE" : "INDIVIDUAL";
}

/**
 * Precedence, most specific wins first: an explicit override (e.g. the
 * "editar precio" dialog, or the no-show fee amount) beats the price
 * agreed at booking time, which beats the tarifa as a last-resort fallback
 * for appointments booked before pricing was locked in at agendar-time.
 */
export function resolvePaymentAmount({
    customAmount,
    agreedAmount,
    fallbackRateAmount,
}: {
    customAmount?: number | null;
    agreedAmount?: number | null;
    fallbackRateAmount?: number | null;
}): number | null {
    if (customAmount != null) return customAmount;
    if (agreedAmount != null) return agreedAmount;
    if (fallbackRateAmount != null) return fallbackRateAmount;
    return null;
}

/** Same precedence shape as resolvePaymentAmount. */
export function resolvePayoutType({
    requestedPayoutType,
    agreedPayoutType,
    fallback,
}: {
    requestedPayoutType?: PayoutType | null;
    agreedPayoutType?: PayoutType | null;
    fallback?: PayoutType | null;
}): PayoutType | null {
    if (requestedPayoutType != null) return requestedPayoutType;
    if (agreedPayoutType != null) return agreedPayoutType;
    if (fallback != null) return fallback;
    return null;
}
