import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLatestIntakeFormByUser } from "@/lib/queries/intake-forms";
import { IntakeFormFlow } from "./intake-form-flow";

export const metadata: Metadata = {
    title: "Formulario — Inventario de Vida",
    description: "Completa tu formulario de inventario de vida para tu cita.",
};

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ appointmentId?: string }>;
};

export default async function IntakeFormPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { appointmentId } = await searchParams;

    if (!appointmentId) notFound();

    // Verify session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        redirect(`/agendar/${slug}`);
    }

    // Fetch appointment with psychologist
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            psychologist: {
                select: { name: true, slug: true },
            },
        },
    });

    if (!appointment) notFound();
    if (appointment.userId !== session.user.id) notFound();

    if (
        appointment.status === "PENDING_PAYMENT" ||
        appointment.status === "CONFIRMED"
    ) {
        redirect(`/agendar/${slug}/pago?appointmentId=${appointmentId}`);
    }
    if (appointment.status !== "PENDING_FORM") {
        redirect(`/agendar/${slug}`);
    }

    // Fetch latest intake form for pre-filling
    const latestForm = await getLatestIntakeFormByUser(session.user.id);
    const priorData = latestForm?.data as Record<string, unknown> | null;

    return (
        <IntakeFormFlow
            appointmentId={appointmentId}
            psychologistSlug={slug}
            userName={session.user.name}
            userEmail={session.user.email}
            priorData={priorData}
            expiresAt={appointment.expiresAt?.toISOString() ?? null}
        />
    );
}
