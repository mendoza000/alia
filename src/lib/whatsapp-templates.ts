import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ } from "@/lib/availability";

export const DEFAULT_WHATSAPP_REMINDER_TEMPLATE =
    "Hola {{nombrePaciente}}, te recordamos que tienes una sesión con {{nombrePsicologo}} el {{fecha}} a las {{hora}}. ¡Te esperamos!";

export const DEFAULT_WHATSAPP_TODAY_TEMPLATE =
    "Hola {{nombrePaciente}}, hoy es tu sesión con {{nombrePsicologo}} a las {{hora}}. ¡Nos vemos pronto!";

export function renderWhatsappTemplate(
    template: string,
    vars: Record<string, string>,
): string {
    return Object.entries(vars).reduce(
        (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
        template,
    );
}

export function isAppointmentToday(
    dateTime: Date,
    timezone: string | null | undefined,
    now: Date = new Date(),
): boolean {
    const tz = timezone ?? CARACAS_TZ;
    const appointmentDay = format(new TZDate(dateTime, tz), "yyyy-MM-dd");
    const today = format(new TZDate(now, tz), "yyyy-MM-dd");
    return appointmentDay === today;
}

export function pickWhatsappTemplate(
    psychologist: {
        whatsappReminderTemplate: string | null;
        whatsappTodaySessionTemplate: string | null;
    },
    isToday: boolean,
): string {
    if (isToday) {
        return (
            psychologist.whatsappTodaySessionTemplate ??
            DEFAULT_WHATSAPP_TODAY_TEMPLATE
        );
    }
    return (
        psychologist.whatsappReminderTemplate ??
        DEFAULT_WHATSAPP_REMINDER_TEMPLATE
    );
}

export function buildAppointmentWhatsappMessage(input: {
    dateTime: Date;
    timezone: string | null | undefined;
    patientName: string;
    psychologistName: string;
    whatsappReminderTemplate: string | null;
    whatsappTodaySessionTemplate: string | null;
    now?: Date;
}): string {
    const isToday = isAppointmentToday(
        input.dateTime,
        input.timezone,
        input.now,
    );
    const template = pickWhatsappTemplate(input, isToday);
    const tz = input.timezone ?? CARACAS_TZ;
    const zoned = new TZDate(input.dateTime, tz);

    return renderWhatsappTemplate(template, {
        nombrePaciente: input.patientName,
        nombrePsicologo: input.psychologistName,
        fecha: format(zoned, "EEEE d 'de' MMMM", { locale: es }),
        hora: format(zoned, "h:mm a", { locale: es }),
    });
}
