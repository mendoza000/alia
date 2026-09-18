"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    intakeFormAdminUpdateSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Reuses intakeFormAdminUpdateSchema (already correctly relaxes the forced
 * clinicalDataConsent: true for editing a pre-existing form) — IntakeForm is
 * one-per-user (unique userId), no longer tied to a single appointment's
 * lifecycle, so no appointment-status gating is needed here at all.
 */
export async function updateMyIntakeForm(
    data: IntakeFormData,
): Promise<ActionResult> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: "Debes iniciar sesión" };
        }

        const validated = await intakeFormAdminUpdateSchema.validate(data, {
            abortEarly: false,
        });

        const existing = await prisma.intakeForm.findUnique({
            where: { userId: session.user.id },
            select: { userId: true },
        });
        if (!existing) {
            return {
                success: false,
                error: "No tienes un formulario para editar",
            };
        }

        await prisma.intakeForm.update({
            where: { userId: session.user.id },
            data: { data: validated },
        });

        revalidatePath("/mi-cuenta", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo actualizar el formulario" };
    }
}
