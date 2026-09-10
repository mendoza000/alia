"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import {
    intakeFormAdminUpdateSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";

export async function updateIntakeForm(
    appointmentId: string,
    data: IntakeFormData,
) {
    await requirePermission("intake.write");

    const validated = await intakeFormAdminUpdateSchema.validate(data, {
        abortEarly: false,
    });

    const appointment = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
        select: { userId: true },
    });

    await prisma.intakeForm.update({
        where: { userId: appointment.userId },
        data: { data: validated },
    });

    revalidatePath("/admin/formularios", "layout");
    revalidatePath(`/admin/formularios/${appointmentId}`);
}

export async function deleteIntakeForm(appointmentId: string) {
    await requirePermission("intake.write");

    const appointment = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
        select: { userId: true },
    });

    // Only the appointment this was deleted from goes back to PENDING_FORM —
    // the patient's other appointments (past or future) are left untouched.
    await prisma.$transaction([
        prisma.intakeForm.delete({ where: { userId: appointment.userId } }),
        prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "PENDING_FORM",
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        }),
    ]);

    revalidatePath("/admin/formularios", "layout");
    revalidatePath("/admin/citas", "layout");
}
