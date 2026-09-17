import { describe, it, expect } from "vitest";
import {
    sessionTypeToRateKind,
    resolvePaymentAmount,
    resolvePayoutType,
} from "../pricing";

describe("sessionTypeToRateKind", () => {
    it("maps INDIVIDUAL to INDIVIDUAL", () => {
        expect(sessionTypeToRateKind("INDIVIDUAL")).toBe("INDIVIDUAL");
    });

    it("maps COUPLE to COUPLE", () => {
        expect(sessionTypeToRateKind("COUPLE")).toBe("COUPLE");
    });
});

describe("resolvePaymentAmount", () => {
    it("prefers customAmount over everything else", () => {
        expect(
            resolvePaymentAmount({
                customAmount: 100,
                agreedAmount: 200,
                fallbackRateAmount: 300,
            }),
        ).toBe(100);
    });

    it("falls back to agreedAmount when there is no customAmount", () => {
        expect(
            resolvePaymentAmount({
                customAmount: null,
                agreedAmount: 200,
                fallbackRateAmount: 300,
            }),
        ).toBe(200);
    });

    it("falls back to fallbackRateAmount when neither customAmount nor agreedAmount is set", () => {
        expect(
            resolvePaymentAmount({
                customAmount: null,
                agreedAmount: null,
                fallbackRateAmount: 300,
            }),
        ).toBe(300);
    });

    it("returns null when nothing is resolvable", () => {
        expect(
            resolvePaymentAmount({
                customAmount: null,
                agreedAmount: null,
                fallbackRateAmount: null,
            }),
        ).toBeNull();
    });
});

describe("resolvePayoutType", () => {
    it("prefers requestedPayoutType over everything else", () => {
        expect(
            resolvePayoutType({
                requestedPayoutType: "NEW",
                agreedPayoutType: "LOYAL",
                fallback: "RECURRING",
            }),
        ).toBe("NEW");
    });

    it("falls back to agreedPayoutType when there is no requestedPayoutType", () => {
        expect(
            resolvePayoutType({
                requestedPayoutType: null,
                agreedPayoutType: "LOYAL",
                fallback: "RECURRING",
            }),
        ).toBe("LOYAL");
    });

    it("falls back to fallback when neither requestedPayoutType nor agreedPayoutType is set", () => {
        expect(
            resolvePayoutType({
                requestedPayoutType: null,
                agreedPayoutType: null,
                fallback: "RECURRING",
            }),
        ).toBe("RECURRING");
    });

    it("returns null when nothing is resolvable", () => {
        expect(
            resolvePayoutType({
                requestedPayoutType: null,
                agreedPayoutType: null,
                fallback: null,
            }),
        ).toBeNull();
    });
});
