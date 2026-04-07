"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";

type SubmitResult = { success: true } | { success: false; error: string };

export async function submitIntakeForm(input: {
    appointmentId: string;
    data: IntakeFormData;
}): Promise<SubmitResult> {
    // 1. Verify session
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, error: "Debes iniciar sesión" };
    }

    // 2. Validate form data
    let validatedData: Record<string, unknown>;
    try {
        validatedData = (await intakeFormSchema.validate(input.data, {
            stripUnknown: true,
        })) as Record<string, unknown>;
    } catch {
        return {
            success: false,
            error: "Los datos del formulario son inválidos",
        };
    }

    // 3. Verify appointment
    const appointment = await prisma.appointment.findUnique({
        where: { id: input.appointmentId },
        select: { id: true, userId: true, status: true, expiresAt: true },
    });

    if (!appointment) {
        return { success: false, error: "Cita no encontrada" };
    }

    if (appointment.userId !== session.user.id) {
        return { success: false, error: "No tienes permiso para esta cita" };
    }

    if (appointment.status !== "PENDING_FORM") {
        return {
            success: false,
            error: "Esta cita ya tiene un formulario completado",
        };
    }

    if (appointment.expiresAt && appointment.expiresAt < new Date()) {
        return {
            success: false,
            error: "Tu tiempo para completar el formulario ha expirado. Por favor agenda una nueva cita.",
        };
    }

    // 4. Create IntakeForm + update appointment status in transaction
    await prisma.$transaction([
        prisma.intakeForm.create({
            data: {
                appointmentId: input.appointmentId,
                userId: session.user.id,
                data: validatedData as Prisma.InputJsonValue,
            },
        }),
        prisma.appointment.update({
            where: { id: input.appointmentId },
            data: { status: "PENDING_PAYMENT", expiresAt: null },
        }),
    ]);

    return { success: true };
}
