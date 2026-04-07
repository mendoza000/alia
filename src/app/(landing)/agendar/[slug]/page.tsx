import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPsychologistBySlug } from "@/lib/queries/psychologists";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    appointmentsToBusyPeriods,
    computeMonthAvailability,
} from "@/lib/availability";
import { getBlockingAppointments } from "@/lib/queries/appointments";
import { TZDate } from "@date-fns/tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { BookingFlow } from "./booking-flow";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ date?: string; time?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) return {};

    return {
        title: `Agendar con ${psychologist.name}`,
        description: `Agenda tu cita con ${psychologist.name}, especialista en ${psychologist.specialty}.`,
    };
}

export default async function BookingPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { date, time } = await searchParams;

    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) notFound();

    const now = new TZDate(new Date(), "America/Bogota");
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const firstDay = new TZDate(year, month - 1, 1, "America/Bogota");
    const timeMin = startOfMonth(firstDay);
    const timeMax = endOfMonth(firstDay);

    const [calendarBusy, appointments] = await Promise.all([
        psychologist.calendarId
            ? getCachedFreeBusyPeriods(
                  psychologist.calendarId,
                  timeMin,
                  timeMax,
              )
            : Promise.resolve([]),
        getBlockingAppointments(psychologist.id, timeMin, timeMax),
    ]);

    const allBusyPeriods = [
        ...calendarBusy,
        ...appointmentsToBusyPeriods(appointments),
    ];

    const initialAvailability = computeMonthAvailability(
        psychologist.schedules,
        allBusyPeriods,
        year,
        month,
        psychologist.sessionDuration,
    );

    // Validate preselected date/time
    const preselectedDate =
        date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    const preselectedTime = time && /^\d{2}:\d{2}$/.test(time) ? time : null;

    return (
        <BookingFlow
            psychologist={psychologist}
            initialAvailability={initialAvailability}
            initialYear={year}
            initialMonth={month}
            preselectedDate={preselectedDate}
            preselectedTime={preselectedTime}
        />
    );
}
