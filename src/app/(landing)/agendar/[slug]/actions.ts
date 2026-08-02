"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { createAppointmentSchema } from "@/lib/validators/appointment";
import {
    getBlockingAppointments,
    getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import { getActivePatientAppointment } from "@/lib/queries/patient-appointments";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import { confirmAndNotifyAppointment } from "@/lib/appointments/confirm-and-notify";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
    toBogotaDate,
    DAILY_CONFIRMED_APPOINTMENT_CAP,
} from "@/lib/availability";
import { getDay, addMinutes } from "date-fns";

type CreateAppointmentResult =
    | { success: true; appointmentId: string; skipForm: boolean }
    | { success: false; error: string };

export async function createAppointment(input: {
    psychologistId: string;
    dateTime: string;
    timezone?: string;
}): Promise<CreateAppointmentResult> {
    // 1. Verify session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, error: "Debes iniciar sesión para agendar" };
    }

    const activeAppointment = await getActivePatientAppointment(
        session.user.id,
    );
    if (activeAppointment) {
        return {
            success: false,
            error: "Ya tienes una sesión activa. Solo puedes tener una sesión pendiente o confirmada a la vez.",
        };
    }

    // 2. Validate input
    let data: { psychologistId: string; dateTime: string; timezone: string };
    try {
        data = await createAppointmentSchema.validate(input, {
            stripUnknown: true,
        });
    } catch {
        return { success: false, error: "Datos inválidos" };
    }

    // 3. Fetch psychologist
    const psychologist = await prisma.psychologist.findUnique({
        where: { id: data.psychologistId, isActive: true },
        include: { schedules: { where: { isActive: true } } },
    });

    if (!psychologist) {
        return { success: false, error: "Psicólogo no encontrado" };
    }

    // 4. Parse times
    const dateStr = data.dateTime.slice(0, 10);
    const timeStr = data.dateTime.slice(11, 16);
    const dateTime = toBogotaDate(dateStr, timeStr);
    const endTime = addMinutes(dateTime, psychologist.sessionDuration);

    // 5. Verify slot matches schedule
    const dayOfWeek = getDay(dateTime);
    const daySchedules = getScheduleForDay(psychologist.schedules, dayOfWeek);
    const allSlots = generateTimeSlots(
        daySchedules,
        psychologist.sessionDuration,
    );
    const slotExists = allSlots.some(s => s.start === timeStr);

    if (!slotExists) {
        return {
            success: false,
            error: "Este horario no está disponible",
        };
    }

    // 5b. Daily confirmed appointment cap for this psychologist
    const dayStart = toBogotaDate(dateStr, "00:00");
    const dayEnd = toBogotaDate(dateStr, "23:59");
    const confirmedCountByDate = await getConfirmedCountsByDate(
        psychologist.id,
        dayStart,
        dayEnd,
    );
    if ((confirmedCountByDate[dateStr] ?? 0) >= DAILY_CONFIRMED_APPOINTMENT_CAP) {
        return {
            success: false,
            error: "Este psicólogo ya alcanzó el máximo de sesiones para este día",
        };
    }

    // 6. Check availability (calendar + existing appointments)
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
    const available = filterPastSlots(afterBusy, dateStr, new Date());

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

    // 7. Create appointment in transaction (re-check for race conditions)
    try {
        const appointment = await prisma.$transaction(async tx => {
            const now = new Date();
            const conflicting = await tx.appointment.findFirst({
                where: {
                    psychologistId: data.psychologistId,
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

            if (patientConflicting) {
                throw new Error("PATIENT_HAS_ACTIVE_APPOINTMENT");
            }

            return tx.appointment.create({
                data: {
                    userId: session.user.id,
                    psychologistId: data.psychologistId,
                    dateTime: slotStart,
                    endTime: slotEnd,
                    status: "PENDING_FORM",
                    expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
                    patientCountry,
                },
            });
        });

        // Check if patient has a prior intake form to skip the form step
        const existingForm = await prisma.intakeForm.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: { data: true },
        });

        if (existingForm) {
            const carriedOverData = {
                ...(existingForm.data as Record<string, unknown>),
                timezone: data.timezone,
            };

            await prisma.$transaction([
                prisma.intakeForm.create({
                    data: {
                        appointmentId: appointment.id,
                        userId: session.user.id,
                        data: carriedOverData as Prisma.InputJsonValue,
                    },
                }),
                prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { status: "CONFIRMED", expiresAt: null },
                }),
            ]);

            await confirmAndNotifyAppointment(appointment.id);

            return { success: true, appointmentId: appointment.id, skipForm: true };
        }

        return { success: true, appointmentId: appointment.id, skipForm: false };
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
        throw error;
    }
}
