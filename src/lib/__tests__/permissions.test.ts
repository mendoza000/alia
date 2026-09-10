import { describe, it, expect } from "vitest";
import {
    can,
    isStaffRole,
    ALL_PERMISSIONS,
    ROLE_PERMISSIONS,
    type Role,
} from "../auth/permissions";

describe("can", () => {
    it("admin has every permission", () => {
        for (const permission of ALL_PERMISSIONS) {
            expect(can("admin", permission)).toBe(true);
        }
    });

    it("patient has none of the staff permissions", () => {
        for (const permission of ALL_PERMISSIONS) {
            expect(can("patient", permission)).toBe(false);
        }
    });

    describe("assistant", () => {
        it("can reclassify commission type and void payments (payment.commission.write)", () => {
            expect(can("assistant", "payment.commission.write")).toBe(true);
        });

        it("can manage coupons", () => {
            expect(can("assistant", "coupon.write")).toBe(true);
        });

        it("can manage rates", () => {
            expect(can("assistant", "rate.write")).toBe(true);
        });

        it("can decide approvals", () => {
            expect(can("assistant", "approval.decide")).toBe(true);
        });

        it("can manage appointments and intake forms without ownership restriction", () => {
            expect(can("assistant", "appointment.write")).toBe(true);
            expect(can("assistant", "appointment.read.all")).toBe(true);
            expect(can("assistant", "intake.write")).toBe(true);
            expect(can("assistant", "intake.read.all")).toBe(true);
            expect(can("assistant", "schedule.write.all")).toBe(true);
        });

        it("cannot read finance", () => {
            expect(can("assistant", "finance.read")).toBe(false);
        });

        it("cannot edit global commission percentages (settings.write)", () => {
            expect(can("assistant", "settings.write")).toBe(false);
        });

        it("cannot manage the psychologist roster (create/delete therapists)", () => {
            expect(can("assistant", "psychologist.write")).toBe(false);
        });

        it("cannot manage staff accounts", () => {
            expect(can("assistant", "staff.write")).toBe(false);
        });
    });

    describe("psychologist", () => {
        it("has appointment.read.own but not appointment.read.all", () => {
            expect(can("psychologist", "appointment.read.own")).toBe(true);
            expect(can("psychologist", "appointment.read.all")).toBe(false);
        });

        it("has schedule.write.own but not schedule.write.all", () => {
            expect(can("psychologist", "schedule.write.own")).toBe(true);
            expect(can("psychologist", "schedule.write.all")).toBe(false);
        });

        it("can write appointments and payment links (ownership enforced elsewhere)", () => {
            expect(can("psychologist", "appointment.write")).toBe(true);
            expect(can("psychologist", "payment.link.create")).toBe(true);
        });

        it("can request approvals but not decide them", () => {
            expect(can("psychologist", "approval.request")).toBe(true);
            expect(can("psychologist", "approval.decide")).toBe(false);
        });

        it("cannot reclassify commission type or void payments", () => {
            expect(can("psychologist", "payment.commission.write")).toBe(false);
        });

        it("cannot manage rates, coupons, or the psychologist roster", () => {
            expect(can("psychologist", "rate.write")).toBe(false);
            expect(can("psychologist", "coupon.write")).toBe(false);
            expect(can("psychologist", "psychologist.write")).toBe(false);
        });

        it("cannot edit intake forms directly (only the narrower patient.write)", () => {
            expect(can("psychologist", "intake.write")).toBe(false);
            expect(can("psychologist", "patient.write")).toBe(true);
        });
    });
});

describe("isStaffRole", () => {
    it.each(["admin", "assistant", "psychologist"])(
        "%s is a staff role",
        role => {
            expect(isStaffRole(role)).toBe(true);
        },
    );

    it.each(["patient", "", "ADMIN", "superadmin"])(
        "%s is not a staff role",
        role => {
            expect(isStaffRole(role)).toBe(false);
        },
    );
});

describe("ROLE_PERMISSIONS", () => {
    it("only contains known roles", () => {
        const roles: Role[] = ["admin", "assistant", "psychologist", "patient"];
        for (const role of roles) {
            expect(ROLE_PERMISSIONS[role]).toBeDefined();
        }
    });
});
