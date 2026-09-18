import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import {
    getActivePatientAppointment,
    hasUnpaidCompletedSession,
} from "@/lib/queries/patient-appointments";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { ActiveAppointmentNotice } from "@/components/booking/active-appointment-notice";
import type { ModalityStatus } from "@/components/booking/modality-picker-step";
import { AgendarBookingFlow } from "./booking-flow";

export const metadata: Metadata = {
    title: "Agendar sesión",
    description:
        "Elige la modalidad de tu sesión y agenda con el especialista disponible.",
};

type Props = {
    searchParams: Promise<{
        type?: string;
        date?: string;
        time?: string;
        tz?: string;
    }>;
};

function isValidTimezone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

export default async function AgendarPage({ searchParams }: Props) {
    const { type, date, time, tz } = await searchParams;
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (session?.user?.id) {
        if (await hasUnpaidCompletedSession(session.user.id)) {
            return (
                <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
                    <BookingStepper currentStep={1} />
                    <ActiveAppointmentNotice variant="unpaid_session" />
                </section>
            );
        }
    }

    const country = headersList.get("x-vercel-ip-country");
    const [individualRate, coupleRate] = await Promise.all([
        getPublicDisplayRate(country, "INDIVIDUAL"),
        getPublicDisplayRate(country, "COUPLE"),
    ]);

    let individualStatus: ModalityStatus = { blocked: false };
    let coupleStatus: ModalityStatus = { blocked: false };

    if (session?.user?.id) {
        const [activeIndividual, activeCouple] = await Promise.all([
            getActivePatientAppointment(session.user.id, "INDIVIDUAL"),
            getActivePatientAppointment(session.user.id, "COUPLE"),
        ]);
        if (activeIndividual) {
            individualStatus = {
                blocked: true,
                dateTime: activeIndividual.dateTime,
                timezone: activeIndividual.timezone,
            };
        }
        if (activeCouple) {
            coupleStatus = {
                blocked: true,
                dateTime: activeCouple.dateTime,
                timezone: activeCouple.timezone,
            };
        }
    }

    return (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <BookingStepper currentStep={1} />
            <div className="mb-10 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Agenda tu sesión
                </h1>
                <p className="mt-3 text-muted-foreground">
                    Elige el tipo de sesión que necesitas — te asignaremos tu
                    especialista al terminar el formulario
                </p>
            </div>

            <AgendarBookingFlow
                individualStatus={individualStatus}
                coupleStatus={coupleStatus}
                individualRate={individualRate}
                coupleRate={coupleRate}
                preselectedSessionType={
                    type === "INDIVIDUAL" || type === "COUPLE" ? type : null
                }
                preselectedDate={
                    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
                }
                preselectedTime={
                    time && /^\d{2}:\d{2}$/.test(time) ? time : null
                }
                preselectedTimezone={tz && isValidTimezone(tz) ? tz : null}
            />
        </section>
    );
}
