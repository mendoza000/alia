"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";
import { confirmAndNotifyAppointment } from "@/lib/appointments/confirm-and-notify";
import { CURRENT_CLINICAL_CONSENT_VERSION } from "@/lib/legal/clinical-consent";

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
        return { success: false, error: "Sesión no encontrada" };
    }

    if (appointment.userId !== session.user.id) {
        return {
            success: false,
            error: "No tienes permiso para esta sesión",
        };
    }

    if (appointment.status !== "PENDING_FORM") {
        return {
            success: false,
            error: "Esta sesión ya tiene un formulario completado",
        };
    }

    if (appointment.expiresAt && appointment.expiresAt < new Date()) {
        return {
            success: false,
            error: "Tu tiempo para completar el formulario ha expirado. Por favor agenda una nueva sesión.",
        };
    }

    // 4. Create the patient's single IntakeForm + confirm the appointment in a transaction
    const timezone =
        typeof validatedData.timezone === "string"
            ? validatedData.timezone
            : undefined;
    const patientCountry =
        typeof validatedData.country === "string"
            ? validatedData.country
            : undefined;

    try {
        await prisma.$transaction([
            prisma.intakeForm.create({
                data: {
                    appointmentId: input.appointmentId,
                    userId: session.user.id,
                    data: validatedData as Prisma.InputJsonValue,
                    clinicalDataConsentVersion: CURRENT_CLINICAL_CONSENT_VERSION,
                    clinicalDataConsentAcceptedAt: new Date(),
                },
            }),
            prisma.appointment.update({
                where: { id: input.appointmentId },
                data: {
                    status: "CONFIRMED",
                    expiresAt: null,
                    timezone,
                    patientCountry,
                    selfBookedAt: new Date(),
                },
            }),
        ]);
    } catch (error) {
        // Two tabs submitting at once could both pass the PENDING_FORM check above;
        // the userId unique constraint is the real guard, so treat that race as success.
        const isDuplicateForm =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            (error.meta?.target as string[] | undefined)?.includes("userId");

        if (!isDuplicateForm) throw error;

        await prisma.appointment.update({
            where: { id: input.appointmentId },
            data: {
                status: "CONFIRMED",
                expiresAt: null,
                timezone,
                patientCountry,
                selfBookedAt: new Date(),
            },
        });
    }

    await confirmAndNotifyAppointment(input.appointmentId);

    return { success: true };
}
