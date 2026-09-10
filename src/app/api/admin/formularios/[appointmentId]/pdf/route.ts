import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type JSX } from "react";
import { Document } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/require";
import { can } from "@/lib/auth/permissions";
import { IntakeFormPDF } from "@/components/admin/intake-form-pdf";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ appointmentId: string }> },
) {
    const actor = await getCurrentActor();
    if (!actor) {
        return new NextResponse("No autorizado", { status: 401 });
    }

    const { appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            user: { select: { name: true, email: true, intakeForm: true } },
            psychologist: { select: { name: true } },
        },
    });

    if (!appointment?.user.intakeForm) {
        return new NextResponse("Formulario no encontrado", { status: 404 });
    }

    const canReadAny = can(actor.role, "intake.read.all");
    const canReadOwn =
        can(actor.role, "intake.read.own") &&
        appointment.psychologistId === actor.psychologistId;
    if (!canReadAny && !canReadOwn) {
        return new NextResponse("No autorizado", { status: 401 });
    }

    const formData = intakeFormSchema.cast(appointment.user.intakeForm.data, {
        assert: false,
        stripUnknown: true,
    }) as IntakeFormData;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(IntakeFormPDF, {
        patientName: appointment.user.name,
        patientEmail: appointment.user.email,
        psychologistName: appointment.psychologist.name,
        appointmentDate: appointment.dateTime,
        submittedAt: appointment.user.intakeForm.createdAt,
        data: formData,
    }) as JSX.Element as Parameters<typeof renderToBuffer>[0];

    let buffer: Buffer;
    try {
        buffer = await renderToBuffer(element);
    } catch (err) {
        console.error("PDF render failed:", err);
        return new NextResponse("No se pudo generar el PDF del formulario", {
            status: 500,
        });
    }

    const filename = `formulario-${appointment.user.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
