import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ForbiddenError } from "./errors";
import { can, type Permission, type Role } from "./permissions";

export type Actor = {
    userId: string;
    role: Role;
    /** Set only when `role === "psychologist"`; null otherwise. */
    psychologistId: string | null;
};

/**
 * Every role value that has ever existed in the `user` table today is either
 * `"admin"` or `"patient"` — `"assistant"`/`"psychologist"` accounts don't
 * exist until Fase 1 creates them. Any string that isn't one of the four
 * known roles falls back to `"patient"`, the least-privileged role, rather
 * than trusting an unrecognized value.
 */
function normalizeRole(raw: string | undefined | null): Role {
    if (raw === "admin" || raw === "assistant" || raw === "psychologist") {
        return raw;
    }
    return "patient";
}

export async function getCurrentActor(): Promise<Actor | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;

    const role = normalizeRole(session.user.role);

    let psychologistId: string | null = null;
    if (role === "psychologist") {
        const psychologist = await prisma.psychologist.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });
        psychologistId = psychologist?.id ?? null;
    }

    return { userId: session.user.id, role, psychologistId };
}

export async function requireActor(): Promise<Actor> {
    const actor = await getCurrentActor();
    if (!actor) throw new ForbiddenError("Debes iniciar sesión");
    return actor;
}

export async function requirePermission(
    permission: Permission,
): Promise<Actor> {
    const actor = await requireActor();
    if (!can(actor.role, permission)) {
        throw new ForbiddenError("No tienes permiso para realizar esta acción");
    }
    return actor;
}

/**
 * Narrows an already-permission-checked action to the actor's own
 * appointment when they're a psychologist. Admin/assistant already passed
 * the broader `appointment.write`/`.read.all` check and are never narrowed
 * here — this only ever restricts a psychologist.
 */
export async function requireOwnAppointment(
    actor: Actor,
    appointmentId: string,
): Promise<void> {
    if (actor.role !== "psychologist") return;

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { psychologistId: true },
    });

    if (!appointment || appointment.psychologistId !== actor.psychologistId) {
        throw new ForbiddenError("Esta sesión no te pertenece");
    }
}

/**
 * Same pattern as `requireOwnAppointment`, for schedule edits: admin/
 * assistant (who hold `schedule.write.all`) can edit any psychologist's
 * schedule; a psychologist (who only holds `schedule.write.own`) can only
 * edit their own.
 */
export async function requireScheduleAccess(
    actor: Actor,
    psychologistId: string,
): Promise<void> {
    if (can(actor.role, "schedule.write.all")) return;

    if (
        can(actor.role, "schedule.write.own") &&
        actor.psychologistId === psychologistId
    ) {
        return;
    }

    throw new ForbiddenError("No tienes permiso para editar este horario");
}

/**
 * Resolves the `psychologistId` a read-scoped query should actually use.
 * Admin/assistant (`appointment.read.all`) get whatever they asked for,
 * including no filter at all. A psychologist (`appointment.read.own`) always
 * gets forced to their own id — a requested id, if any, is ignored rather
 * than honored or rejected, since "give me everyone else's" isn't a
 * meaningful request to deny, it's just not what they asked correctly.
 */
export function resolvePsychologistScope(
    actor: Actor,
    requestedPsychologistId?: string,
): string | undefined {
    if (can(actor.role, "appointment.read.all")) return requestedPsychologistId;
    if (can(actor.role, "appointment.read.own") && actor.psychologistId) {
        return actor.psychologistId;
    }
    throw new ForbiddenError("No tienes permiso para leer estas sesiones");
}
