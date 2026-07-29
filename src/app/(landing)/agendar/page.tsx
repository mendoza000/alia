import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { getActivePatientAppointment } from "@/lib/queries/patient-appointments";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { ActiveAppointmentNotice } from "@/components/booking/active-appointment-notice";
import { PsychologistGrid } from "./psychologist-grid";

export const metadata: Metadata = {
    title: "Agendar sesión",
    description:
        "Elige a tu psicólogo y agenda tu sesión de forma fácil y rápida.",
};

export default async function AgendarPage() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (session?.user?.id) {
        const activeAppointment = await getActivePatientAppointment(
            session.user.id,
        );
        if (activeAppointment) {
            return (
                <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
                    <BookingStepper currentStep={1} />
                    <ActiveAppointmentNotice
                        psychologistName={activeAppointment.psychologist.name}
                        dateTime={activeAppointment.dateTime}
                    />
                </section>
            );
        }
    }

    const country = headersList.get("x-vercel-ip-country");
    const [psychologists, globalRate] = await Promise.all([
        getActivePsychologists(),
        getPublicDisplayRate(country),
    ]);

    return (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <BookingStepper currentStep={1} />
            <div className="mb-10 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Elige a tu psicólogo
                </h1>
                <p className="mt-3 text-muted-foreground">
                    Selecciona al profesional con el que deseas agendar tu sesión
                </p>
            </div>

            {psychologists.length > 0 ? (
                <PsychologistGrid
                    psychologists={psychologists}
                    globalRate={globalRate}
                />
            ) : (
                <p className="text-center text-muted-foreground">
                    No hay psicólogos disponibles en este momento.
                </p>
            )}
        </section>
    );
}
