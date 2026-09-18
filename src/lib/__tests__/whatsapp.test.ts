import { describe, it, expect } from "vitest";
import { normalizeWhatsappPhone, buildWhatsappLink } from "../whatsapp";

describe("normalizeWhatsappPhone", () => {
    it("returns null for null, undefined, or empty input", () => {
        expect(normalizeWhatsappPhone(null)).toBeNull();
        expect(normalizeWhatsappPhone(undefined)).toBeNull();
        expect(normalizeWhatsappPhone("")).toBeNull();
        expect(normalizeWhatsappPhone("   ")).toBeNull();
    });

    it("strips spaces, dashes, parentheses, and dots", () => {
        expect(normalizeWhatsappPhone("+57 300 123 4567")).toBe("573001234567");
        expect(normalizeWhatsappPhone("(57) 300-123-4567")).toBe(
            "573001234567",
        );
        expect(normalizeWhatsappPhone("57.300.123.4567")).toBe("573001234567");
    });

    it("strips a leading plus sign", () => {
        expect(normalizeWhatsappPhone("+573001234567")).toBe("573001234567");
    });

    it("passes through an already-normalized number", () => {
        expect(normalizeWhatsappPhone("573001234567")).toBe("573001234567");
    });

    it("returns null when the digits are too short", () => {
        expect(normalizeWhatsappPhone("12345")).toBeNull();
    });

    it("returns null when the digits are too long", () => {
        expect(normalizeWhatsappPhone("1234567890123456")).toBeNull();
    });

    it("returns null when there are no digits at all", () => {
        expect(normalizeWhatsappPhone("N/A")).toBeNull();
    });
});

describe("buildWhatsappLink", () => {
    it("builds a wa.me link with the phone in the path", () => {
        const link = buildWhatsappLink("573001234567", "Hola");
        expect(link.startsWith("https://wa.me/573001234567?text=")).toBe(true);
    });

    it("URL-encodes the message so it round-trips through decodeURIComponent", () => {
        const message = "Hola, ¿cómo estás? Línea 1\nLínea 2";
        const link = buildWhatsappLink("573001234567", message);
        const [, encoded] = link.split("?text=");
        expect(decodeURIComponent(encoded)).toBe(message);
    });
});
