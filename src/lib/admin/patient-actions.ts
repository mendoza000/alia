"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { can } from "@/lib/auth/permissions";
import { requireActor, type Actor } from "@/lib/auth/require";
import { ForbiddenError } from "@/lib/auth/errors";
import { patientProfileUpdateSchema } from "@/lib/validators/patient";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Two separate permissions grant access to the same patient for different
 * reasons: intake.write (admin/assistant — any patient, same scope as the
 * old Formularios section) or patient.write (psychologist — only a patient
 * they've actually had an appointment with).
 */
async function requirePatientAccess(userId: string): Promise<Actor> {
    const actor = await requireActor();
    if (can(actor.role, "intake.write")) return actor;

    if (can(actor.role, "patient.write") && actor.psychologistId) {
        const owns = await prisma.appointment.findFirst({
            where: { userId, psychologistId: actor.psychologistId },
            select: { id: true },
        });
        if (owns) return actor;
    }

    throw new ForbiddenError("No tienes permiso para ver este paciente");
}

/**
 * Shared write core between the admin ("Clientes") and patient
 * ("mi-cuenta/perfil") edit flows — permission/ownership checks stay in the
 * callers, this only does the actual mutation.
 */
export async function updatePatientProfileCore(
    userId: string,
    input: { name: string; phone?: string; dateOfBirth?: string },
): Promise<void> {
    const validated = await patientProfileUpdateSchema.validate(input, {
        abortEarly: false,
    });

    const existingForm = await prisma.intakeForm.findUnique({
        where: { userId },
    });

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { name: validated.name },
        }),
        ...(existingForm
            ? [
                  prisma.intakeForm.update({
                      where: { userId },
                      data: {
                          data: {
                              ...(existingForm.data as Record<string, unknown>),
                              ...(validated.phone
                                  ? { phone: validated.phone }
                                  : {}),
                              ...(validated.dateOfBirth
                                  ? { dateOfBirth: validated.dateOfBirth }
                                  : {}),
                          },
                      },
                  }),
              ]
            : []),
    ]);
}

export async function updatePatientProfile(
    userId: string,
    input: { name: string; phone?: string; dateOfBirth?: string },
): Promise<ActionResult> {
    try {
        await requirePatientAccess(userId);
        await updatePatientProfileCore(userId, input);
        revalidatePath("/admin/clientes", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo actualizar el perfil" };
    }
}

export async function addPatientNote(
    userId: string,
    body: string,
): Promise<ActionResult> {
    try {
        const actor = await requirePatientAccess(userId);

        const trimmed = body.trim();
        if (!trimmed) {
            return { success: false, error: "La nota no puede estar vacía" };
        }

        // A note is always attributed to a psychologist. When admin/
        // assistant writes one, attribute it to whoever most recently
        // treated this patient — there's no arbitrary "no psychologist"
        // option in the schema, and that's the least-arbitrary default.
        let psychologistId = actor.psychologistId;
        if (!psychologistId) {
            const recent = await prisma.appointment.findFirst({
                where: { userId },
                orderBy: { dateTime: "desc" },
                select: { psychologistId: true },
            });
            psychologistId = recent?.psychologistId ?? null;
        }
        if (!psychologistId) {
            return {
                success: false,
                error: "No se pudo determinar el psicólogo para esta nota",
            };
        }

        await prisma.patientNote.create({
            data: { userId, psychologistId, body: trimmed },
        });

        revalidatePath(`/admin/clientes/${userId}`);
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo agregar la nota" };
    }
}
