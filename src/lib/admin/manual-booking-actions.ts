"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDay, addMinutes } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import {
    getBlockingAppointments,
    getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import {
    getActivePatientAppointment,
    hasUnpaidCompletedSession,
} from "@/lib/queries/patient-appointments";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import { confirmAndNotifyAppointment } from "@/lib/appointments/confirm-and-notify";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
    toCaracasDate,
    getSessionDuration,
    DAILY_CONFIRMED_APPOINTMENT_CAP,
} from "@/lib/availability";
import type { PayoutType, SessionType } from "@/generated/prisma/enums";

type ManualBookingInput = {
    psychologistId: string;
    patientEmail: string;
    patientName: string;
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:mm"
    timezone: string;
    notes?: string;
    internalNotes?: string;
    isException?: boolean;
    sessionType?: SessionType;
    agreedAmount?: number;
    agreedCurrency?: string;
    agreedPayoutType?: PayoutType;
};

type ManualBookingResult =
    | { success: true; appointmentId: string; warning?: string }
    | { success: false; error: string };

export async function createManualAppointment(
    input: ManualBookingInput,
): Promise<ManualBookingResult> {
    const actor = await requirePermission("appointment.write");

    // A psychologist can only book for themselves — the psychologistId they
    // sent (if any) is ignored, not validated, since there's nothing to warn
    // them about: they simply can't act on anyone else's calendar.
    if (actor.role === "psychologist") {
        if (!actor.psychologistId) {
            return {
                success: false,
                error: "Tu cuenta no está vinculada a un perfil de psicólogo",
            };
        }
        input = { ...input, psychologistId: actor.psychologistId };
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: input.psychologistId, isActive: true },
        include: { schedules: { where: { isActive: true } } },
    });
    if (!psychologist) {
        return { success: false, error: "Psicólogo no encontrado" };
    }

    const sessionType: SessionType = input.sessionType ?? "INDIVIDUAL";
    if (
        sessionType === "COUPLE" &&
        !psychologist.offeredSessionTypes.includes("COUPLE")
    ) {
        return {
            success: false,
            error: "Este psicólogo no atiende sesiones de pareja",
        };
    }

    const bypassAvailability = input.isException === true;

    const sessionDuration = getSessionDuration(psychologist, sessionType);
    const slotStart = toCaracasDate(input.date, input.time);
    const slotEnd = addMinutes(slotStart, sessionDuration);

    if (!bypassAvailability) {
        const dayOfWeek = getDay(slotStart);
        const daySchedules = getScheduleForDay(
            psychologist.schedules,
            dayOfWeek,
        );
        const allSlots = generateTimeSlots(daySchedules, sessionDuration);
        const slot = allSlots.find(s => s.start === input.time);
        if (!slot) {
            return {
                success: false,
                error: "Este horario no está dentro del horario del psicólogo",
            };
        }

        const [calendarBusy, existingAppointments] = await Promise.all([
            psychologist.calendarId
                ? getCachedFreeBusyPeriods(
                      psychologist.calendarId,
                      slotStart,
                      slotEnd,
                  )
                : Promise.resolve([]),
            getBlockingAppointments(psychologist.id, slotStart, slotEnd),
        ]);
        const allBusy = [
            ...calendarBusy,
            ...appointmentsToBusyPeriods(existingAppointments),
        ];
        const afterBusy = subtractBusyPeriods([slot], allBusy, input.date);
        const available = filterPastSlots(afterBusy, input.date, new Date());
        if (available.length === 0) {
            return { success: false, error: "Este horario ya está ocupado" };
        }
    }

    if (!bypassAvailability) {
        const confirmedCountByDate = await getConfirmedCountsByDate(
            psychologist.id,
            toCaracasDate(input.date, "00:00"),
            toCaracasDate(input.date, "23:59"),
        );
        if (
            (confirmedCountByDate[input.date] ?? 0) >=
            DAILY_CONFIRMED_APPOINTMENT_CAP
        ) {
            return {
                success: false,
                error: "Este psicólogo ya alcanzó el máximo de sesiones para este día",
            };
        }
    }

    const normalizedEmail = input.patientEmail.trim().toLowerCase();

    let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!user) {
        try {
            const result = await auth.api.createUser({
                body: {
                    email: normalizedEmail,
                    name: input.patientName,
                },
                headers: await headers(),
            });
            user = await prisma.user.findUnique({
                where: { id: result.user.id },
            });
        } catch (error) {
            // Race or case-mismatch: another request may have created this user
            // between the findUnique above and createUser. Re-check before failing.
            user = await prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (!user) throw error;
        }
    }
    if (!user) {
        return {
            success: false,
            error: "No se pudo crear el usuario del paciente",
        };
    }
    const patientId = user.id;

    const activeAppointment = await getActivePatientAppointment(
        patientId,
        sessionType,
    );
    const activeAppointmentWarning = activeAppointment
        ? "Este paciente ya tenía una sesión activa."
        : undefined;

    // Soft warning, not a hard block — consistent with the active-appointment
    // conflict above: manual booking by staff is the sanctioned override
    // path for both. If the client actually wants staff hard-blocked instead
    // for an unpaid session, this is a one-branch change (return an error
    // instead of composing the warning string) — flagged for confirmation.
    const hasUnpaid = await hasUnpaidCompletedSession(patientId);
    const unpaidWarning = hasUnpaid
        ? "Este paciente tiene una sesión completada sin pagar."
        : undefined;

    const combinedWarning = [activeAppointmentWarning, unpaidWarning]
        .filter(Boolean)
        .join(" ");
    const warning = combinedWarning
        ? `${combinedWarning} Se creó igual por ser un agendamiento manual.`
        : undefined;

    let appointmentId: string;
    try {
        const appointment = await prisma.$transaction(async tx => {
            if (!bypassAvailability) {
                const conflicting = await tx.appointment.findFirst({
                    where: {
                        psychologistId: input.psychologistId,
                        dateTime: { lt: slotEnd },
                        endTime: { gt: slotStart },
                        OR: [
                            { status: "CONFIRMED" },
                            {
                                status: "PENDING_FORM",
                                OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gt: new Date() } },
                                ],
                            },
                        ],
                    },
                });
                if (conflicting) throw new Error("SLOT_TAKEN");
            }

            return tx.appointment.create({
                data: {
                    userId: patientId,
                    psychologistId: input.psychologistId,
                    dateTime: slotStart,
                    endTime: slotEnd,
                    status: "CONFIRMED",
                    notes: input.notes || null,
                    internalNotes: input.internalNotes || null,
                    timezone: input.timezone,
                    isException: bypassAvailability,
                    sessionType,
                    agreedAmount: input.agreedAmount ?? null,
                    agreedCurrency: input.agreedCurrency ?? null,
                    agreedPayoutType: input.agreedPayoutType ?? null,
                },
            });
        });
        appointmentId = appointment.id;
    } catch (error) {
        if (error instanceof Error && error.message === "SLOT_TAKEN") {
            return { success: false, error: "Este horario ya está ocupado" };
        }
        throw error;
    }

    const existingForm = await prisma.intakeForm.findUnique({
        where: { userId: patientId },
        select: { userId: true },
    });

    if (!existingForm) {
        await prisma.intakeForm.create({
            data: {
                appointmentId,
                userId: patientId,
                data: {
                    fullName: input.patientName,
                    email: normalizedEmail,
                    timezone: input.timezone,
                    consultationReason:
                        input.notes ||
                        "Cita agendada manualmente por el equipo de ALIA.",
                },
            },
        });
    }

    await confirmAndNotifyAppointment(appointmentId);

    revalidatePath("/admin/citas", "layout");
    return { success: true, appointmentId, warning };
}
