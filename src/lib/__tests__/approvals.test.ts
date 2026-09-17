import { describe, it, expect } from "vitest";
import { requiresSettingsWriteEscalation } from "../approvals";

describe("requiresSettingsWriteEscalation", () => {
    it("returns false for each of the 4 known PayoutType values", () => {
        expect(requiresSettingsWriteEscalation("RECURRING")).toBe(false);
        expect(requiresSettingsWriteEscalation("NEW")).toBe(false);
        expect(requiresSettingsWriteEscalation("LOYAL")).toBe(false);
        expect(requiresSettingsWriteEscalation("LOYAL_NEW")).toBe(false);
    });

    it("returns true for a value outside the closed PayoutType set (an arbitrary percentage)", () => {
        expect(requiresSettingsWriteEscalation("CUSTOM_37_PERCENT")).toBe(true);
    });

    it("returns true for null/undefined/non-string payloads", () => {
        expect(requiresSettingsWriteEscalation(null)).toBe(true);
        expect(requiresSettingsWriteEscalation(undefined)).toBe(true);
        expect(requiresSettingsWriteEscalation(42)).toBe(true);
        expect(requiresSettingsWriteEscalation({})).toBe(true);
    });
});
