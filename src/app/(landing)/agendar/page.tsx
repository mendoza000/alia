import type { Metadata } from "next";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { PsychologistGrid } from "./psychologist-grid";

export const metadata: Metadata = {
    title: "Agendar cita",
    description:
        "Elige a tu psicólogo y agenda tu cita de forma fácil y rápida.",
};

export default async function AgendarPage() {
    const psychologists = await getActivePsychologists();

    return (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <BookingStepper currentStep={1} />
            <div className="mb-10 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Elige a tu psicólogo
                </h1>
                <p className="mt-3 text-muted-foreground">
                    Selecciona al profesional con el que deseas agendar tu cita
                </p>
            </div>

            {psychologists.length > 0 ? (
                <PsychologistGrid psychologists={psychologists} />
            ) : (
                <p className="text-center text-muted-foreground">
                    No hay psicólogos disponibles en este momento.
                </p>
            )}
        </section>
    );
}
