"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updatePatientProfileCore } from "@/lib/admin/patient-actions";
import { patientProfileUpdateSchema } from "@/lib/validators/patient";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Patient-facing counterpart to the admin's updatePatientProfile — always
 * self (no userId param), same core write logic, same validator
 * (deliberately excludes email, better-auth's login identifier).
 */
export async function updateMyProfile(input: {
    name: string;
    phone?: string;
    dateOfBirth?: string;
}): Promise<ActionResult> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: "Debes iniciar sesión" };
        }

        await patientProfileUpdateSchema.validate(input, { abortEarly: false });
        await updatePatientProfileCore(session.user.id, input);

        revalidatePath("/mi-cuenta", "layout");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "No se pudo actualizar el perfil" };
    }
}
