import { prisma } from "@/lib/db";
import type { SessionType } from "@/generated/prisma/enums";

/** Candidates for auto-match (Fase 7.1) — unlike getActivePsychologists,
 * this selects everything the match engine needs (calendarId, schedules,
 * both session durations) and filters by modality. */
export async function getBookablePsychologists(sessionType: SessionType) {
    return prisma.psychologist.findMany({
        where: {
            isActive: true,
            offeredSessionTypes: { has: sessionType },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            calendarId: true,
            sessionDuration: true,
            coupleSessionDuration: true,
            offeredSessionTypes: true,
            schedules: { where: { isActive: true } },
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function getActivePsychologists() {
    return prisma.psychologist.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            slug: true,
            photoUrl: true,
            specialty: true,
            bio: true,
            sessionDuration: true,
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function getPsychologistBySlug(slug: string) {
    return prisma.psychologist.findUnique({
        where: { slug },
        include: {
            schedules: {
                where: { isActive: true },
                orderBy: { dayOfWeek: "asc" },
            },
        },
    });
}
