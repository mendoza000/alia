"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import { STAFF_ROLES, type Role } from "@/lib/auth/permissions";
import type { StaffUserFormData } from "@/lib/validators/staff";

/**
 * Created directly against Prisma rather than through
 * `auth.api.createUser` (the admin plugin's endpoint), which runs its own
 * internal RBAC check against a role vocabulary ("admin"/"user") we never
 * configured for our custom roles. `prisma/seed.ts` already creates the
 * one hand-seeded admin account the same way — this stays consistent
 * with that instead of depending on better-auth's own permission system,
 * which this codebase doesn't otherwise use.
 *
 * No password is set here. `auth.api.requestPasswordReset` sends the new
 * staff member the same "set your password" email flow patients use to
 * reset theirs — its `resetPassword` endpoint creates the credential
 * account on first use if one doesn't exist yet, so this doubles as the
 * welcome email the plan asked for.
 */
export async function createStaffUser(input: StaffUserFormData): Promise<void> {
    await requirePermission("staff.write");

    const role = input.role as Role;
    if (!STAFF_ROLES.includes(role)) {
        throw new Error("Rol inválido");
    }
    if (role === "psychologist" && !input.psychologistId) {
        throw new Error("Selecciona el psicólogo a vincular");
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (existing) {
        throw new Error("Ya existe un usuario con ese correo");
    }

    if (role === "psychologist" && input.psychologistId) {
        const psychologist = await prisma.psychologist.findUnique({
            where: { id: input.psychologistId },
            select: { userId: true },
        });
        if (!psychologist) {
            throw new Error("Psicólogo no encontrado");
        }
        if (psychologist.userId) {
            throw new Error("Ese psicólogo ya tiene una cuenta vinculada");
        }
    }

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: normalizedEmail,
            role,
            emailVerified: true,
        },
    });

    if (role === "psychologist" && input.psychologistId) {
        await prisma.psychologist.update({
            where: { id: input.psychologistId },
            data: { userId: user.id },
        });
    }

    await auth.api.requestPasswordReset({
        body: { email: normalizedEmail, redirectTo: "/admin/login" },
    });

    revalidatePath("/admin/equipo");
}

export async function updateStaffRole(
    userId: string,
    role: Role,
): Promise<void> {
    await requirePermission("staff.write");
    if (!STAFF_ROLES.includes(role)) {
        throw new Error("Rol inválido");
    }

    const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (current?.role === "psychologist" && role !== "psychologist") {
        // Moving a psychologist account to another role leaves the
        // Psychologist record without an owner — unlink it rather than
        // leaving a stale userId pointing at an account that can no longer
        // act as that psychologist.
        await prisma.psychologist.updateMany({
            where: { userId },
            data: { userId: null },
        });
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/admin/equipo");
}

export async function setStaffUserBanned(
    userId: string,
    banned: boolean,
): Promise<void> {
    await requirePermission("staff.write");
    await prisma.user.update({ where: { id: userId }, data: { banned } });
    revalidatePath("/admin/equipo");
}
