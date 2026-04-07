import { type NextRequest, NextResponse } from "next/server";
import { availabilityQuerySchema } from "@/lib/validators/availability";
import { prisma } from "@/lib/db";
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
import { getDay, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    let params: { psychologistId: string; date: string };
    try {
        params = await availabilityQuerySchema.validate(searchParams, {
            abortEarly: false,
            stripUnknown: true,
        });
    } catch (err) {
        const yupError = err as { errors?: string[] };
        return NextResponse.json(
            { error: "Parámetros inválidos", details: yupError.errors },
            { status: 400 },
        );
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: params.psychologistId },
        include: { schedules: { where: { isActive: true } } },
    });

    if (!psychologist) {
        return NextResponse.json(
            { error: "Psicólogo no encontrado" },
            { status: 404 },
        );
    }

    const dateInBogota = new TZDate(
        `${params.date}T00:00:00`,
        "America/Bogota",
    );
    const dayOfWeek = getDay(dateInBogota);
    const dayStart = startOfDay(dateInBogota);
    const dayEnd = endOfDay(dateInBogota);

    const daySchedules = getScheduleForDay(psychologist.schedules, dayOfWeek);
    if (daySchedules.length === 0) {
        return NextResponse.json({ date: params.date, slots: [] });
    }

    const allSlots = generateTimeSlots(
        daySchedules,
        psychologist.sessionDuration,
    );

    const [calendarBusy, appointments] = await Promise.all([
        psychologist.calendarId
            ? getCachedFreeBusyPeriods(
                  psychologist.calendarId,
                  dayStart,
                  dayEnd,
              )
            : Promise.resolve([]),
        getBlockingAppointments(psychologist.id, dayStart, dayEnd),
    ]);

    const allBusy = [
        ...calendarBusy,
        ...appointmentsToBusyPeriods(appointments),
    ];
    const afterBusy = subtractBusyPeriods(allSlots, allBusy, params.date);
    const availableSlots = filterPastSlots(afterBusy, params.date, new Date());

    return NextResponse.json({ date: params.date, slots: availableSlots });
}
