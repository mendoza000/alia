"use server";

import { headers } from "next/headers";
import { getDay, addMinutes } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms";
import { createAutoAssignedAppointmentSchema } from "@/lib/validators/appointment";
import {
    getBlockingAppointments,
    getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import {
    getActivePatientAppointment,
    getAssignedPsychologistForModality,
    hasUnpaidCompletedSession,
} from "@/lib/queries/patient-appointments";
import { isBlockingUnpaidSession } from "@/lib/patient/unpaid-session";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import { confirmAndNotifyAppointment } from "@/lib/appointments/confirm-and-notify";
import { scheduleIntakeFormFollowUps } from "@/lib/appointments/schedule-follow-ups";
import {
    matchPsychologistForSlot,
    getAggregatedMonthAvailability,
} from "@/lib/availability/multi-psychologist";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
    toCaracasDate,
    getSessionDuration,
    DAILY_CONFIRMED_APPOINTMENT_CAP,
    MIN_BOOKING_LEAD_MINUTES,
    PENDING_FORM_EXPIRY_MINUTES,
    type MonthAvailability,
} from "@/lib/availability";
import type { SessionType } from "@/generated/prisma/enums";

export async function getAggregatedMonthAvailabilityAction(
    sessionType: SessionType,
    year: number,
    month: number,
): Promise<MonthAvailability> {
    return getAggregatedMonthAvailability(sessionType, year, month);
}

type CreateAutoAssignedAppointmentResult =
    | { success: true; appointmentId: string; skipForm: boolean }
    | { success: false; error: string };

/**
 * The slug-less counterpart to agendar/[slug]/actions.ts's
 * createAppointment — same 13-step shape (session → guards → validate →
 * terms → resolve psychologist → verify slot/cap/freebusy → transaction
 * with the same 3 re-checks → post-transaction skip-form branching), except
 * the psychologist is resolved via the Fase 7.1 match engine instead of
 * being client-supplied input.
 */
export async function createAutoAssignedAppointment(input: {
    sessionType: SessionType;
    dateTime: string;
    timezone?: string;
    termsVersion: string;
}): Promise<CreateAutoAssignedAppointmentResult> {
    // 1. Verify session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, error: "Debes iniciar sesión para agendar" };
    }

    // 2. Validate input
    let data: {
        sessionType: SessionType;
        dateTime: string;
        timezone: string;
        termsVersion: string;
    };
    try {
        data = await createAutoAssignedAppointmentSchema.validate(input, {
            stripUnknown: true,
        });
    } catch {
        return { success: false, error: "Datos inválidos" };
    }

    // 3. Per-modality active-appointment guard — separate concept from the
    // global unpaid-session block below (Fase 6, do not touch).
    const activeAppointment = await getActivePatientAppointment(
        session.user.id,
        data.sessionType,
    );
    if (activeAppointment) {
        return {
            success: false,
            error: "Ya tienes una sesión activa. Solo puedes tener una sesión pendiente o confirmada a la vez.",
        };
    }

    if (await hasUnpaidCompletedSession(session.user.id)) {
        return {
            success: false,
            error: "Tienes una sesión completada con un pago pendiente. Paga esa sesión antes de agendar una nueva.",
        };
    }

    if (data.termsVersion !== CURRENT_TERMS_VERSION) {
        return {
            success: false,
            error: "La versión de los Términos y Condiciones cambió. Por favor recarga la página e intenta de nuevo.",
        };
    }

    // 4. Resolve the psychologist via the match engine — recurring patients
    // get their assigned specialist for this modality, everyone else gets
    // whoever's least loaded and eligible for this exact slot.
    const dateStr = data.dateTime.slice(0, 10);
    const timeStr = data.dateTime.slice(11, 16);

    const preferredPsychologistId = await getAssignedPsychologistForModality(
        session.user.id,
        data.sessionType,
    );
    const match = await matchPsychologistForSlot(
        data.sessionType,
        dateStr,
        timeStr,
        { preferredPsychologistId: preferredPsychologistId ?? undefined },
    );
    if (!match) {
        return {
            success: false,
            error: "No hay especialistas disponibles para este horario. Elige otro.",
        };
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: match.psychologistId, isActive: true },
        include: { schedules: { where: { isActive: true } } },
    });

    if (!psychologist) {
        return { success: false, error: "Psicólogo no encontrado" };
    }

    // 5. Parse times
    const sessionDuration = getSessionDuration(psychologist, data.sessionType);
    const dateTime = toCaracasDate(dateStr, timeStr);
    const endTime = addMinutes(dateTime, sessionDuration);

    // 6. Verify slot matches schedule
    const dayOfWeek = getDay(dateTime);
    const daySchedules = getScheduleForDay(psychologist.schedules, dayOfWeek);
    const allSlots = generateTimeSlots(daySchedules, sessionDuration);
    const slotExists = allSlots.some(s => s.start === timeStr);

    if (!slotExists) {
        return {
            success: false,
            error: "Este horario no está disponible",
        };
    }

    // 7. Daily confirmed appointment cap for this psychologist
    const dayStart = toCaracasDate(dateStr, "00:00");
    const dayEnd = toCaracasDate(dateStr, "23:59");
    const confirmedCountByDate = await getConfirmedCountsByDate(
        psychologist.id,
        dayStart,
        dayEnd,
    );
    if (
        (confirmedCountByDate[dateStr] ?? 0) >= DAILY_CONFIRMED_APPOINTMENT_CAP
    ) {
        return {
            success: false,
            error: "Este psicólogo ya alcanzó el máximo de sesiones para este día",
        };
    }

    // 8. Check availability (calendar + existing appointments)
    const slotStart = new Date(dateTime.getTime());
    const slotEnd = new Date(endTime.getTime());

    const [calendarBusy, appointments] = await Promise.all([
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
        ...appointmentsToBusyPeriods(appointments),
    ];

    const afterBusy = subtractBusyPeriods(
        [{ start: timeStr, end: allSlots.find(s => s.start === timeStr)!.end }],
        allBusy,
        dateStr,
    );
    const available = filterPastSlots(
        afterBusy,
        dateStr,
        new Date(),
        MIN_BOOKING_LEAD_MINUTES,
    );

    if (available.length === 0) {
        return {
            success: false,
            error: "Este horario ya no está disponible",
        };
    }

    // Best-effort patient country capture (Vercel-only header, absent locally)
    let patientCountry: string | null = null;
    try {
        patientCountry = (await headers()).get("x-vercel-ip-country");
    } catch {
        patientCountry = null;
    }

    // 9. Create appointment in transaction (re-check for race conditions)
    try {
        const appointment = await prisma.$transaction(async tx => {
            const now = new Date();
            const conflicting = await tx.appointment.findFirst({
                where: {
                    psychologistId: psychologist.id,
                    dateTime: { lt: slotEnd },
                    endTime: { gt: slotStart },
                    OR: [
                        { status: "CONFIRMED" },
                        {
                            status: "PENDING_FORM",
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: now } },
                            ],
                        },
                    ],
                },
            });

            if (conflicting) {
                throw new Error("SLOT_TAKEN");
            }

            const patientConflicting = await tx.appointment.findFirst({
                where: {
                    userId: session.user.id,
                    sessionType: data.sessionType,
                    OR: [
                        { status: "CONFIRMED", endTime: { gt: now } },
                        {
                            status: "PENDING_FORM",
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: now } },
                            ],
                        },
                    ],
                },
            });

            if (patientConflicting) {
                throw new Error("PATIENT_HAS_ACTIVE_APPOINTMENT");
            }

            const unpaidCandidates = await tx.appointment.findMany({
                where: {
                    userId: session.user.id,
                    status: { in: ["COMPLETED", "NO_SHOW"] },
                },
                select: {
                    status: true,
                    finalizedAt: true,
                    payment: { select: { status: true, refundStatus: true } },
                },
            });
            if (unpaidCandidates.some(c => isBlockingUnpaidSession(c, now))) {
                throw new Error("UNPAID_SESSION_PENDING");
            }

            return tx.appointment.create({
                data: {
                    userId: session.user.id,
                    psychologistId: psychologist.id,
                    sessionType: data.sessionType,
                    dateTime: slotStart,
                    endTime: slotEnd,
                    status: "PENDING_FORM",
                    expiresAt: new Date(
                        now.getTime() + PENDING_FORM_EXPIRY_MINUTES * 60 * 1000,
                    ),
                    patientCountry,
                    termsVersion: data.termsVersion,
                    termsAcceptedAt: now,
                },
            });
        });

        // Check if the patient already has an intake form to skip the form step —
        // it's shared across all of their appointments, no need to create another one
        const existingForm = await prisma.intakeForm.findUnique({
            where: { userId: session.user.id },
            select: { userId: true },
        });

        if (existingForm) {
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: {
                    status: "CONFIRMED",
                    expiresAt: null,
                    timezone: data.timezone,
                },
            });

            await confirmAndNotifyAppointment(appointment.id);

            return {
                success: true,
                appointmentId: appointment.id,
                skipForm: true,
            };
        }

        await scheduleIntakeFormFollowUps(appointment.id);

        return {
            success: true,
            appointmentId: appointment.id,
            skipForm: false,
        };
    } catch (error) {
        if (error instanceof Error && error.message === "SLOT_TAKEN") {
            return {
                success: false,
                error: "Este horario ya no está disponible",
            };
        }
        if (
            error instanceof Error &&
            error.message === "PATIENT_HAS_ACTIVE_APPOINTMENT"
        ) {
            return {
                success: false,
                error: "Ya tienes una sesión activa. Solo puedes tener una sesión pendiente o confirmada a la vez.",
            };
        }
        if (
            error instanceof Error &&
            error.message === "UNPAID_SESSION_PENDING"
        ) {
            return {
                success: false,
                error: "Tienes una sesión completada con un pago pendiente. Paga esa sesión antes de agendar una nueva.",
            };
        }
        throw error;
    }
}
