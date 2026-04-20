"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CalendarPlusIcon, CheckCircle2Icon } from "lucide-react";
import { ease } from "@/lib/motion";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { Button } from "@/components/ui/button";
import { simulatePayment } from "./actions";

function buildGoogleCalendarUrl(
    dateTime: string,
    sessionDuration: number,
    psychologistName: string,
): string {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + sessionDuration * 60 * 1000);

    const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `Consulta ALIA — ${psychologistName}`,
        dates: `${fmt(start)}/${fmt(end)}`,
        details: `Cita de psicología con ${psychologistName} a través de ALIA`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const currencyFormat = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

type PaymentPlaceholderProps = {
    appointmentId: string;
    psychologistName: string;
    psychologistSlug: string;
    dateTime: string;
    sessionDuration: number;
    sessionRate: number;
    alreadyConfirmed?: boolean;
};

export function PaymentPlaceholder({
    appointmentId,
    psychologistName,
    psychologistSlug,
    dateTime,
    sessionDuration,
    sessionRate,
    alreadyConfirmed = false,
}: PaymentPlaceholderProps) {
    const [isPaying, startPayment] = useTransition();
    const [confirmed, setConfirmed] = useState(alreadyConfirmed);

    const date = new Date(dateTime);
    const formattedDate = format(date, "EEEE d 'de' MMMM, yyyy", {
        locale: es,
    });
    const formattedTime = format(date, "HH:mm");

    function handleSimulatePayment() {
        startPayment(async () => {
            const result = await simulatePayment(appointmentId);

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            setConfirmed(true);
        });
    }

    return (
        <section className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
            <BookingStepper currentStep={4} />

            {confirmed ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease }}
                    className="rounded-lg bg-card p-8 text-center ring-1 ring-border/50"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2,
                        }}
                        className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent/20"
                    >
                        <CheckCircle2Icon className="size-8 text-accent" />
                    </motion.div>
                    <h2 className="font-heading text-2xl font-bold">
                        ¡Cita confirmada!
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Tu cita con {psychologistName} ha sido agendada
                        exitosamente.
                    </p>
                    <div className="mt-4 rounded-md bg-secondary/50 p-4 text-sm">
                        <p className="font-medium capitalize">
                            {formattedDate}
                        </p>
                        <p className="text-muted-foreground">
                            {formattedTime} — {sessionDuration} min
                        </p>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Recibirás un correo de confirmación con los detalles.
                    </p>
                    <a
                        href={buildGoogleCalendarUrl(
                            dateTime,
                            sessionDuration,
                            psychologistName,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                        <CalendarPlusIcon className="size-4" />
                        Agregar a Google Calendar
                    </a>
                </motion.div>
            ) : (
                <div>
                    <div className="mb-8 text-center">
                        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                            Pago
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Confirma tu cita completando el pago
                        </p>
                    </div>

                    <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                        {/* Test mode banner */}
                        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <strong>Modo de prueba</strong> — El pago con Wompi
                            se habilitará próximamente.
                        </div>

                        {/* Summary */}
                        <h2 className="mb-4 font-heading text-lg font-semibold">
                            Resumen
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Psicólogo
                                </span>
                                <span className="font-medium">
                                    {psychologistName}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Fecha
                                </span>
                                <span className="font-medium capitalize">
                                    {formattedDate}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Hora
                                </span>
                                <span className="font-medium">
                                    {formattedTime}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Duración
                                </span>
                                <span className="font-medium">
                                    {sessionDuration} min
                                </span>
                            </div>
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>
                                        {currencyFormat.format(sessionRate)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSimulatePayment}
                            isLoading={isPaying}
                            className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/80"
                            size="lg"
                        >
                            Simular pago exitoso
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
