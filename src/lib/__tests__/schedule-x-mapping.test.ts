import { describe, it, expect } from "vitest";
import { buildTimedEventContent } from "../admin/schedule-x-mapping";

describe("buildTimedEventContent", () => {
    it("includes the title and a formatted time range in both outputs", () => {
        const result = buildTimedEventContent(
            "María Pérez",
            new Date("2026-09-18T18:00:00Z"), // 14:00 Caracas
            new Date("2026-09-18T19:00:00Z"), // 15:00 Caracas
        );
        expect(result.timeGrid).toContain("María Pérez");
        expect(result.timeGrid).toContain("2:00");
        expect(result.monthGrid).toContain("María Pérez");
        expect(result.monthGrid).toContain("2:00");
    });

    it("HTML-escapes a title containing markup (XSS prevention)", () => {
        const result = buildTimedEventContent(
            '<img src=x onerror="alert(1)">',
            new Date("2026-09-18T18:00:00Z"),
            new Date("2026-09-18T19:00:00Z"),
        );
        expect(result.timeGrid).not.toContain("<img");
        expect(result.timeGrid).toContain("&lt;img");
        expect(result.monthGrid).not.toContain("<img");
    });

    it("escapes ampersands and quotes", () => {
        const result = buildTimedEventContent(
            `Juan & "Ana"`,
            new Date("2026-09-18T18:00:00Z"),
            new Date("2026-09-18T19:00:00Z"),
        );
        expect(result.timeGrid).toContain("Juan &amp; &quot;Ana&quot;");
    });
});
