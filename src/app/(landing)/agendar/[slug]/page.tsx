import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPsychologistBySlug } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    appointmentsToBusyPeriods,
    timeOffToBusyPeriods,
    computeMonthAvailability,
    CARACAS_TZ,
} from "@/lib/availability";
import {
    getBlockingAppointments,
    getConfirmedCountsByDate,
} from "@/lib/queries/appointments";
import { getTimeOffOverlapping } from "@/lib/admin/time-off-actions";
import {
    getActivePatientAppointment,
    hasUnpaidCompletedSession,
} from "@/lib/queries/patient-appointments";
import { TZDate } from "@date-fns/tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { ActiveAppointmentNotice } from "@/components/booking/active-appointment-notice";
import { BookingFlow } from "./booking-flow";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ date?: string; time?: string; tz?: string }>;
};

function isValidTimezone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) return {};

    return {
        title: `Agendar con ${psychologist.name}`,
        description: `Agenda tu sesión con ${psychologist.name}, especialista en ${psychologist.specialty}.`,
    };
}

export default async function BookingPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { date, time, tz } = await searchParams;

    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) notFound();

    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
        const activeAppointment = await getActivePatientAppointment(
            session.user.id,
        );
        if (activeAppointment) {
            return (
                <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
                    <BookingStepper currentStep={2} />
                    <ActiveAppointmentNotice
                        psychologistName={activeAppointment.psychologist.name}
                        dateTime={activeAppointment.dateTime}
                        patientTimezone={
                            activeAppointment.timezone ?? undefined
                        }
                    />
                </section>
            );
        }

        if (await hasUnpaidCompletedSession(session.user.id)) {
            return (
                <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
                    <BookingStepper currentStep={2} />
                    <ActiveAppointmentNotice variant="unpaid_session" />
                </section>
            );
        }
    }

    const now = new TZDate(new Date(), CARACAS_TZ);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const firstDay = new TZDate(year, month - 1, 1, CARACAS_TZ);
    const timeMin = startOfMonth(firstDay);
    const timeMax = endOfMonth(firstDay);

    const country = (await headers()).get("x-vercel-ip-country");
    const [
        calendarBusy,
        appointments,
        timeOffs,
        globalRate,
        confirmedCountByDate,
    ] = await Promise.all([
        psychologist.calendarId
            ? getCachedFreeBusyPeriods(
                  psychologist.calendarId,
                  timeMin,
                  timeMax,
              )
            : Promise.resolve([]),
        getBlockingAppointments(psychologist.id, timeMin, timeMax),
        getTimeOffOverlapping(psychologist.id, timeMin, timeMax),
        getPublicDisplayRate(country),
        getConfirmedCountsByDate(psychologist.id, timeMin, timeMax),
    ]);

    const allBusyPeriods = [
        ...calendarBusy,
        ...appointmentsToBusyPeriods(appointments),
        ...timeOffToBusyPeriods(timeOffs),
    ];

    const initialAvailability = computeMonthAvailability(
        psychologist.schedules,
        allBusyPeriods,
        year,
        month,
        psychologist.sessionDuration,
        confirmedCountByDate,
    );

    // Validate preselected date/time/timezone
    const preselectedDate =
        date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    const preselectedTime = time && /^\d{2}:\d{2}$/.test(time) ? time : null;
    const preselectedTimezone = tz && isValidTimezone(tz) ? tz : null;

    return (
        <BookingFlow
            psychologist={psychologist}
            globalRate={globalRate}
            initialAvailability={initialAvailability}
            initialYear={year}
            initialMonth={month}
            preselectedDate={preselectedDate}
            preselectedTime={preselectedTime}
            preselectedTimezone={preselectedTimezone}
        />
    );
}
