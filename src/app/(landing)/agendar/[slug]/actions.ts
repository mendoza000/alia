"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { createAppointmentSchema } from "@/lib/validators/appointment";
import { getBlockingAppointments } from "@/lib/queries/appointments";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    getScheduleForDay,
    generateTimeSlots,
    subtractBusyPeriods,
    filterPastSlots,
    appointmentsToBusyPeriods,
} from "@/lib/availability";
import { TZDate } from "@date-fns/tz";
import { getDay, addMinutes } from "date-fns";

type CreateAppointmentResult =
    | { success: true; appointmentId: string; skipForm: boolean }
    | { success: false; error: string };

export async function createAppointment(input: {
    psychologistId: string;
    dateTime: string;
}): Promise<CreateAppointmentResult> {
    // 1. Verify session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, error: "Debes iniciar sesión para agendar" };
    }

    // 2. Validate input
    let data: { psychologistId: string; dateTime: string };
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
    const dateTime = new TZDate(`${data.dateTime}:00`, "America/Bogota");
    const endTime = addMinutes(dateTime, psychologist.sessionDuration);
    const dateStr = data.dateTime.slice(0, 10);
    const timeStr = data.dateTime.slice(11, 16);

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
                        { status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } },
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

            return tx.appointment.create({
                data: {
                    userId: session.user.id,
                    psychologistId: data.psychologistId,
                    dateTime: slotStart,
                    endTime: slotEnd,
                    status: "PENDING_FORM",
                    expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
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
            await prisma.$transaction([
                prisma.intakeForm.create({
                    data: {
                        appointmentId: appointment.id,
                        userId: session.user.id,
                        data: existingForm.data as Prisma.InputJsonValue,
                    },
                }),
                prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { status: "PENDING_PAYMENT", expiresAt: null },
                }),
            ]);
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
        throw error;
    }
}
