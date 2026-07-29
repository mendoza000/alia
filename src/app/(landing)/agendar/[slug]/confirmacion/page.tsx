import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlusIcon, CheckCircle2Icon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { BookingConfirmedTracker } from "@/components/analytics/booking-confirmed-tracker";

export const metadata: Metadata = {
    title: "Sesión confirmada",
    description: "Tu sesión ha sido confirmada.",
};

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ appointmentId?: string }>;
};

function buildGoogleCalendarUrl(
    dateTime: Date,
    sessionDuration: number,
    psychologistName: string,
): string {
    const end = new Date(dateTime.getTime() + sessionDuration * 60 * 1000);
    const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `Sesión ALIA — ${psychologistName}`,
        dates: `${fmt(dateTime)}/${fmt(end)}`,
        details: `Sesión de acompañamiento con ${psychologistName} a través de ALIA`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function ConfirmationPage({
    params,
    searchParams,
}: Props) {
    const { slug } = await params;
    const { appointmentId } = await searchParams;

    if (!appointmentId) notFound();

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
        redirect(`/agendar/${slug}`);
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            psychologist: {
                select: { name: true, sessionDuration: true },
            },
        },
    });

    if (!appointment) notFound();
    if (appointment.userId !== session.user.id) notFound();

    if (appointment.status === "PENDING_FORM") {
        redirect(`/agendar/${slug}/formulario?appointmentId=${appointmentId}`);
    }
    if (appointment.status !== "CONFIRMED") {
        redirect(`/agendar/${slug}`);
    }

    const country = headersList.get("x-vercel-ip-country");
    const rate = await getPublicDisplayRate(country);

    const formattedDate = format(
        appointment.dateTime,
        "EEEE d 'de' MMMM, yyyy",
        {
            locale: es,
        },
    );
    const formattedTime = format(appointment.dateTime, "HH:mm");

    return (
        <section className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
            <BookingConfirmedTracker
                appointmentId={appointment.id}
                value={rate?.amount}
                currency={rate?.currency}
            />
            <BookingStepper currentStep={4} />

            <div className="rounded-lg bg-card p-8 text-center ring-1 ring-border/50">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent/20">
                    <CheckCircle2Icon className="size-8 text-accent" />
                </div>
                <h2 className="font-heading text-2xl font-bold">
                    ¡Sesión confirmada!
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Tu sesión con {appointment.psychologist.name} ha sido
                    agendada exitosamente.
                </p>
                <div className="mt-4 rounded-md bg-secondary/50 p-4 text-sm">
                    <p className="font-medium capitalize">{formattedDate}</p>
                    <p className="text-muted-foreground">
                        {formattedTime} —{" "}
                        {appointment.psychologist.sessionDuration} min
                    </p>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                    Recibirás un correo de confirmación con los detalles. El
                    pago de la sesión se coordina después de la sesión.
                </p>
                <a
                    href={buildGoogleCalendarUrl(
                        appointment.dateTime,
                        appointment.psychologist.sessionDuration,
                        appointment.psychologist.name,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                    <CalendarPlusIcon className="size-4" />
                    Agregar a Google Calendar
                </a>
            </div>
        </section>
    );
}
