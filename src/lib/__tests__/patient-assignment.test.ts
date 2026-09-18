import { describe, it, expect } from "vitest";
import { deriveTracksFromAppointments } from "@/lib/queries/patient-assignment";

const PSY_A = {
    id: "psy-a",
    name: "Ana",
    slug: "ana",
    photoUrl: null,
    specialty: "TCC",
};
const PSY_B = {
    id: "psy-b",
    name: "Beto",
    slug: "beto",
    photoUrl: null,
    specialty: "Sistémica",
};

function row(overrides: {
    sessionType: "INDIVIDUAL" | "COUPLE";
    status:
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "PENDING_FORM"
        | "NO_SHOW";
    dateTime: string;
    psychologist: typeof PSY_A;
}) {
    return { ...overrides, dateTime: new Date(overrides.dateTime) };
}

describe("deriveTracksFromAppointments", () => {
    it("returns an empty map with no history", () => {
        expect(deriveTracksFromAppointments([])).toEqual({});
    });

    it("assigns only INDIVIDUAL when that's the only history", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "INDIVIDUAL",
                status: "CONFIRMED",
                dateTime: "2026-09-10T10:00:00Z",
                psychologist: PSY_A,
            }),
        ]);
        expect(tracks).toEqual({ INDIVIDUAL: PSY_A });
    });

    it("assigns only COUPLE when that's the only history", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "COUPLE",
                status: "COMPLETED",
                dateTime: "2026-09-10T10:00:00Z",
                psychologist: PSY_B,
            }),
        ]);
        expect(tracks).toEqual({ COUPLE: PSY_B });
    });

    it("assigns both tracks independently to different psychologists", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "INDIVIDUAL",
                status: "CONFIRMED",
                dateTime: "2026-09-12T10:00:00Z",
                psychologist: PSY_A,
            }),
            row({
                sessionType: "COUPLE",
                status: "CONFIRMED",
                dateTime: "2026-09-11T10:00:00Z",
                psychologist: PSY_B,
            }),
        ]);
        expect(tracks).toEqual({ INDIVIDUAL: PSY_A, COUPLE: PSY_B });
    });

    it("picks the most recent CONFIRMED/COMPLETED appointment per sessionType (rows assumed pre-sorted desc)", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "INDIVIDUAL",
                status: "CONFIRMED",
                dateTime: "2026-09-15T10:00:00Z",
                psychologist: PSY_B,
            }),
            row({
                sessionType: "INDIVIDUAL",
                status: "COMPLETED",
                dateTime: "2026-09-01T10:00:00Z",
                psychologist: PSY_A,
            }),
        ]);
        expect(tracks).toEqual({ INDIVIDUAL: PSY_B });
    });

    it("never lets a more recent CANCELLED appointment override an earlier CONFIRMED one for the same sessionType", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "INDIVIDUAL",
                status: "CANCELLED",
                dateTime: "2026-09-15T10:00:00Z",
                psychologist: PSY_B,
            }),
            row({
                sessionType: "INDIVIDUAL",
                status: "CONFIRMED",
                dateTime: "2026-09-01T10:00:00Z",
                psychologist: PSY_A,
            }),
        ]);
        expect(tracks).toEqual({ INDIVIDUAL: PSY_A });
    });

    it("ignores PENDING_FORM and NO_SHOW appointments entirely", () => {
        const tracks = deriveTracksFromAppointments([
            row({
                sessionType: "INDIVIDUAL",
                status: "PENDING_FORM",
                dateTime: "2026-09-15T10:00:00Z",
                psychologist: PSY_B,
            }),
            row({
                sessionType: "INDIVIDUAL",
                status: "NO_SHOW",
                dateTime: "2026-09-14T10:00:00Z",
                psychologist: PSY_B,
            }),
        ]);
        expect(tracks).toEqual({});
    });
});
