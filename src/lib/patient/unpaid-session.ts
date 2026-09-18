import type {
    AppointmentStatus,
    PaymentStatus,
    RefundStatus,
} from "@/generated/prisma/enums";

export const UNPAID_SESSION_GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 2 days

export type UnpaidSessionCandidate = {
    status: AppointmentStatus;
    finalizedAt: Date | null;
    payment: {
        status: PaymentStatus;
        refundStatus: RefundStatus | null;
    } | null;
};

/**
 * Deliberately takes no sessionType — the confirmed business decision
 * (overriding plan-v2.md's original "por modalidad" assumption) is that an
 * unpaid COMPLETED/NO_SHOW session in ANY modality blocks booking a new
 * appointment in ANY modality. Not accepting sessionType here makes it
 * structurally hard to accidentally re-scope this by modality later.
 */
export function isBlockingUnpaidSession(
    candidate: UnpaidSessionCandidate,
    now: Date,
): boolean {
    if (candidate.status !== "COMPLETED" && candidate.status !== "NO_SHOW") {
        return false;
    }

    // finalizedAt can be null for rows created before that column existed
    // (backfilled by a data-only migration, but treated defensively here
    // too) — a missing timestamp fails toward "grace period already
    // elapsed" rather than silently exempting an old, unresolved session
    // forever.
    const graceExpired =
        candidate.finalizedAt === null ||
        now.getTime() - candidate.finalizedAt.getTime() >=
            UNPAID_SESSION_GRACE_PERIOD_MS;
    if (!graceExpired) return false;

    return isUnresolvedPayment(candidate.payment);
}

function isUnresolvedPayment(
    payment: UnpaidSessionCandidate["payment"],
): boolean {
    if (!payment) return true; // never charged
    if (payment.status === "VOIDED") return false;
    if (payment.status === "APPROVED") {
        // Fase 5.1b composition: a refund that's decided but not yet
        // manually executed in Stripe still leaves this session's billing
        // unresolved. Once executed, treat it like VOIDED.
        return payment.refundStatus === "PENDING_EXECUTION";
    }
    return true; // PENDING or REJECTED
}
