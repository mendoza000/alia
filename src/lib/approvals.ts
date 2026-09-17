/**
 * Pure approval-workflow logic (Fase 5). No DB, no "use server" — same shape
 * as pricing.ts. The DB-coupled caller (approveRequest in
 * approval-actions.ts) fetches the request/payload and hands the raw value
 * here.
 */
import type { PayoutType } from "@/generated/prisma/enums";

const KNOWN_PAYOUT_TYPES: readonly PayoutType[] = [
    "RECURRING",
    "NEW",
    "LOYAL",
    "LOYAL_NEW",
];

/**
 * Enforcement point for the Fase 0 business rule: an `approveRequest` call
 * that would set a commission percentage outside the closed `PayoutType` set
 * (i.e. an arbitrary percentage instead of picking among RECURRING/NEW/
 * LOYAL/LOYAL_NEW) requires `settings.write` (admin-only), even though
 * `approval.decide` alone is normally enough for an assistant to approve a
 * custom amount request.
 */
export function requiresSettingsWriteEscalation(payoutType: unknown): boolean {
    return !KNOWN_PAYOUT_TYPES.includes(payoutType as PayoutType);
}
