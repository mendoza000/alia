import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentPlaceholder } from "./payment-placeholder";

export const metadata: Metadata = {
    title: "Pago — Agendar cita",
    description: "Completa el pago para confirmar tu cita.",
};

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ appointmentId?: string }>;
};

export default async function PaymentPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { appointmentId } = await searchParams;

    if (!appointmentId) notFound();

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        redirect(`/agendar/${slug}`);
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            psychologist: {
                select: {
                    name: true,
                    slug: true,
                    sessionRate: true,
                    sessionDuration: true,
                },
            },
        },
    });

    if (!appointment) notFound();
    if (appointment.userId !== session.user.id) notFound();

    const isConfirmed = appointment.status === "CONFIRMED";
    if (appointment.status !== "PENDING_PAYMENT" && !isConfirmed) {
        redirect(`/agendar/${slug}`);
    }

    return (
        <PaymentPlaceholder
            appointmentId={appointmentId}
            psychologistName={appointment.psychologist.name}
            psychologistSlug={appointment.psychologist.slug}
            dateTime={appointment.dateTime.toISOString()}
            sessionDuration={appointment.psychologist.sessionDuration}
            sessionRate={appointment.psychologist.sessionRate}
            alreadyConfirmed={isConfirmed}
        />
    );
}
