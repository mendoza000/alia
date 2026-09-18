import { describe, it, expect } from "vitest";
import {
    isBlockingUnpaidSession,
    UNPAID_SESSION_GRACE_PERIOD_MS,
    type UnpaidSessionCandidate,
} from "@/lib/patient/unpaid-session";

const NOW = new Date("2026-09-17T12:00:00.000Z");

function candidate(
    overrides: Partial<UnpaidSessionCandidate> = {},
): UnpaidSessionCandidate {
    return {
        status: "COMPLETED",
        finalizedAt: new Date(NOW.getTime() - 72 * 60 * 60 * 1000),
        payment: null,
        ...overrides,
    };
}

describe("isBlockingUnpaidSession", () => {
    it("never blocks for CONFIRMED, PENDING_FORM, or CANCELLED status, regardless of payment", () => {
        for (const status of [
            "CONFIRMED",
            "PENDING_FORM",
            "CANCELLED",
        ] as const) {
            expect(
                isBlockingUnpaidSession(
                    candidate({ status, payment: null }),
                    NOW,
                ),
            ).toBe(false);
        }
    });

    it("does not block within the 48h grace period after finalizedAt", () => {
        const finalizedAt = new Date(NOW.getTime() - 60 * 60 * 1000); // 1h ago
        expect(isBlockingUnpaidSession(candidate({ finalizedAt }), NOW)).toBe(
            false,
        );
    });

    it("blocks exactly at the 48h grace boundary (inclusive)", () => {
        const finalizedAt = new Date(
            NOW.getTime() - UNPAID_SESSION_GRACE_PERIOD_MS,
        );
        expect(isBlockingUnpaidSession(candidate({ finalizedAt }), NOW)).toBe(
            true,
        );
    });

    it("blocks a COMPLETED session finalized 72h ago with no payment", () => {
        expect(isBlockingUnpaidSession(candidate({ payment: null }), NOW)).toBe(
            true,
        );
    });

    it("blocks the same session when payment status is PENDING", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: { status: "PENDING", refundStatus: null },
                }),
                NOW,
            ),
        ).toBe(true);
    });

    it("blocks the same session when payment status is REJECTED", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: { status: "REJECTED", refundStatus: null },
                }),
                NOW,
            ),
        ).toBe(true);
    });

    it("does not block when payment status is VOIDED", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: { status: "VOIDED", refundStatus: null },
                }),
                NOW,
            ),
        ).toBe(false);
    });

    it("does not block when payment is APPROVED with no refund in flight", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: { status: "APPROVED", refundStatus: null },
                }),
                NOW,
            ),
        ).toBe(false);
    });

    it("blocks when payment is APPROVED but a refund is PENDING_EXECUTION", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: {
                        status: "APPROVED",
                        refundStatus: "PENDING_EXECUTION",
                    },
                }),
                NOW,
            ),
        ).toBe(true);
    });

    it("does not block once the refund is EXECUTED", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({
                    payment: { status: "APPROVED", refundStatus: "EXECUTED" },
                }),
                NOW,
            ),
        ).toBe(false);
    });

    it("applies the same rule to NO_SHOW as to COMPLETED", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({ status: "NO_SHOW", payment: null }),
                NOW,
            ),
        ).toBe(true);
    });

    it("treats a null finalizedAt as grace-expired (fails toward blocking, not exempting)", () => {
        expect(
            isBlockingUnpaidSession(
                candidate({ finalizedAt: null, payment: null }),
                NOW,
            ),
        ).toBe(true);
    });

    // This block is deliberately global, not per-modality: a single
    // isBlockingUnpaidSession candidate never carries a sessionType field,
    // and hasUnpaidCompletedSession (patient-appointments.ts) checks across
    // ALL of a patient's sessions regardless of modality. Do not "fix" this
    // by adding a sessionType filter — see plan-v2.md's confirmed override
    // of its own "por modalidad" assumption for Fase 6.4.
});
