import { describe, it, expect } from "vitest";
import { getPatientPhoneFromIntakeFormData } from "../patient-phone";

describe("getPatientPhoneFromIntakeFormData", () => {
    it("returns the phone when present as a non-empty string", () => {
        expect(
            getPatientPhoneFromIntakeFormData({ phone: "+57 300 123 4567" }),
        ).toBe("+57 300 123 4567");
    });

    it("returns null when data is null or undefined", () => {
        expect(getPatientPhoneFromIntakeFormData(null)).toBeNull();
        expect(getPatientPhoneFromIntakeFormData(undefined)).toBeNull();
    });

    it("returns null when phone is missing", () => {
        expect(getPatientPhoneFromIntakeFormData({})).toBeNull();
    });

    it("returns null when phone is not a string", () => {
        expect(
            getPatientPhoneFromIntakeFormData({ phone: 573001234567 }),
        ).toBeNull();
        expect(getPatientPhoneFromIntakeFormData({ phone: null })).toBeNull();
    });

    it("returns null when phone is an empty or blank string", () => {
        expect(getPatientPhoneFromIntakeFormData({ phone: "" })).toBeNull();
        expect(getPatientPhoneFromIntakeFormData({ phone: "   " })).toBeNull();
    });

    it("returns null when data is not an object", () => {
        expect(getPatientPhoneFromIntakeFormData("not an object")).toBeNull();
        expect(getPatientPhoneFromIntakeFormData(42)).toBeNull();
    });
});
