import { describe, it, expect } from "vitest";
import {
    DEFAULT_WHATSAPP_REMINDER_TEMPLATE,
    DEFAULT_WHATSAPP_TODAY_TEMPLATE,
    renderWhatsappTemplate,
    isAppointmentToday,
    pickWhatsappTemplate,
    buildAppointmentWhatsappMessage,
} from "../whatsapp-templates";

describe("renderWhatsappTemplate", () => {
    it("substitutes all known placeholders", () => {
        const result = renderWhatsappTemplate(
            "Hola {{nombrePaciente}}, tu sesión con {{nombrePsicologo}} es el {{fecha}} a las {{hora}}",
            {
                nombrePaciente: "María",
                nombrePsicologo: "Dr. Pérez",
                fecha: "lunes 12 de enero",
                hora: "3:00 p. m.",
            },
        );
        expect(result).toBe(
            "Hola María, tu sesión con Dr. Pérez es el lunes 12 de enero a las 3:00 p. m.",
        );
    });

    it("leaves unknown placeholders untouched", () => {
        const result = renderWhatsappTemplate("Hola {{desconocido}}", {
            nombrePaciente: "María",
        });
        expect(result).toBe("Hola {{desconocido}}");
    });

    it("replaces repeated occurrences of the same placeholder", () => {
        const result = renderWhatsappTemplate(
            "{{nombrePaciente}}, {{nombrePaciente}}!",
            { nombrePaciente: "Ana" },
        );
        expect(result).toBe("Ana, Ana!");
    });
});

describe("isAppointmentToday", () => {
    it("is true when the appointment and now fall on the same Caracas day", () => {
        const dateTime = new Date("2026-01-15T02:00:00Z"); // 2026-01-14 22:00 Caracas
        const now = new Date("2026-01-14T20:00:00Z"); // 2026-01-14 16:00 Caracas
        expect(isAppointmentToday(dateTime, null, now)).toBe(true);
    });

    it("is false when the appointment falls on the next Caracas day", () => {
        const dateTime = new Date("2026-01-15T05:00:00Z"); // 2026-01-15 01:00 Caracas
        const now = new Date("2026-01-14T20:00:00Z"); // 2026-01-14 16:00 Caracas
        expect(isAppointmentToday(dateTime, null, now)).toBe(false);
    });

    it("defaults to Caracas time when no timezone is given", () => {
        const dateTime = new Date("2026-01-14T23:30:00Z"); // 2026-01-14 19:30 Caracas
        const now = new Date("2026-01-14T13:00:00Z"); // 2026-01-14 09:00 Caracas
        expect(isAppointmentToday(dateTime, undefined as never, now)).toBe(
            true,
        );
    });
});

describe("pickWhatsappTemplate", () => {
    it("returns the configured reminder template when set and isToday is false", () => {
        const result = pickWhatsappTemplate(
            {
                whatsappReminderTemplate: "custom reminder",
                whatsappTodaySessionTemplate: "custom today",
            },
            false,
        );
        expect(result).toBe("custom reminder");
    });

    it("returns the configured today template when set and isToday is true", () => {
        const result = pickWhatsappTemplate(
            {
                whatsappReminderTemplate: "custom reminder",
                whatsappTodaySessionTemplate: "custom today",
            },
            true,
        );
        expect(result).toBe("custom today");
    });

    it("falls back to the default reminder template when not configured", () => {
        const result = pickWhatsappTemplate(
            {
                whatsappReminderTemplate: null,
                whatsappTodaySessionTemplate: null,
            },
            false,
        );
        expect(result).toBe(DEFAULT_WHATSAPP_REMINDER_TEMPLATE);
    });

    it("falls back to the default today template when not configured", () => {
        const result = pickWhatsappTemplate(
            {
                whatsappReminderTemplate: null,
                whatsappTodaySessionTemplate: null,
            },
            true,
        );
        expect(result).toBe(DEFAULT_WHATSAPP_TODAY_TEMPLATE);
    });
});

describe("buildAppointmentWhatsappMessage", () => {
    it("renders the reminder template with the appointment's data when it's not today", () => {
        const message = buildAppointmentWhatsappMessage({
            dateTime: new Date("2026-02-20T18:00:00Z"),
            timezone: null,
            patientName: "María",
            psychologistName: "Dr. Pérez",
            whatsappReminderTemplate: null,
            whatsappTodaySessionTemplate: null,
            now: new Date("2026-01-14T13:00:00Z"),
        });
        expect(message).toContain("María");
        expect(message).toContain("Dr. Pérez");
        expect(message).not.toContain("{{");
    });

    it("renders the today template (not the reminder template) when the appointment is today", () => {
        const message = buildAppointmentWhatsappMessage({
            dateTime: new Date("2026-01-14T18:00:00Z"), // 2026-01-14 14:00 Caracas
            timezone: null,
            patientName: "María",
            psychologistName: "Dr. Pérez",
            whatsappReminderTemplate:
                "PLANTILLA RECORDATORIO {{nombrePaciente}}",
            whatsappTodaySessionTemplate: "PLANTILLA HOY {{nombrePaciente}}",
            now: new Date("2026-01-14T13:00:00Z"), // 2026-01-14 09:00 Caracas
        });
        expect(message).toBe("PLANTILLA HOY María");
    });

    it("renders the configured reminder template when the appointment is not today", () => {
        const message = buildAppointmentWhatsappMessage({
            dateTime: new Date("2026-02-20T18:00:00Z"),
            timezone: null,
            patientName: "María",
            psychologistName: "Dr. Pérez",
            whatsappReminderTemplate:
                "PLANTILLA RECORDATORIO {{nombrePaciente}}",
            whatsappTodaySessionTemplate: "PLANTILLA HOY {{nombrePaciente}}",
            now: new Date("2026-01-14T13:00:00Z"),
        });
        expect(message).toBe("PLANTILLA RECORDATORIO María");
    });
});
