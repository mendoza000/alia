import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLatestIntakeFormByUser } from "@/lib/queries/intake-forms";
import { IntakeFormFlow } from "@/components/booking/intake-form-flow";

export const metadata: Metadata = {
    title: "Formulario — Inventario de Vida",
    description: "Completa tu formulario de inventario de vida para tu sesión.",
};

type Props = {
    searchParams: Promise<{ appointmentId?: string; timezone?: string }>;
};

/**
 * Slug-less counterpart to agendar/[slug]/formulario/page.tsx — same guard
 * logic, minus the slug segment. The psychologist is never fetched or
 * passed down here (that's the whole point of the auto-assign flow: the
 * appointment already has a psychologistId, but the UI doesn't reveal it
 * until /agendar/confirmacion).
 */
export default async function IntakeFormPage({ searchParams }: Props) {
    const { appointmentId, timezone } = await searchParams;

    if (!appointmentId) notFound();

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        redirect("/agendar");
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            userId: true,
            status: true,
            expiresAt: true,
            patientCountry: true,
        },
    });

    if (!appointment) notFound();
    if (appointment.userId !== session.user.id) notFound();

    if (appointment.status === "CONFIRMED") {
        redirect(`/agendar/confirmacion?appointmentId=${appointmentId}`);
    }
    if (appointment.status !== "PENDING_FORM") {
        redirect("/agendar");
    }

    const latestForm = await getLatestIntakeFormByUser(session.user.id);
    const priorData = latestForm?.data as Record<string, unknown> | null;

    return (
        <IntakeFormFlow
            appointmentId={appointmentId}
            basePath="/agendar"
            userName={session.user.name}
            userEmail={session.user.email}
            priorData={priorData}
            expiresAt={appointment.expiresAt?.toISOString() ?? null}
            confirmedTimezone={timezone ?? null}
            detectedCountry={appointment.patientCountry}
        />
    );
}
