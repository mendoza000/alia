import { prisma } from "@/lib/db";
import { isBlockingUnpaidSession } from "@/lib/patient/unpaid-session";
import type { SessionType } from "@/generated/prisma/enums";

export async function getPatientAppointments(userId: string) {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            psychologist: {
                select: { name: true, slug: true, photoUrl: true },
            },
            payment: { select: { status: true } },
        },
        orderBy: { dateTime: "desc" },
    });
}

export async function isFirstCompletedAppointment(
    userId: string,
    psychologistId: string,
    beforeDateTime: Date,
): Promise<boolean> {
    const priorCompleted = await prisma.appointment.count({
        where: {
            userId,
            psychologistId,
            status: "COMPLETED",
            dateTime: { lt: beforeDateTime },
        },
    });
    return priorCompleted === 0;
}

const UNPAID_CANDIDATE_SELECT = {
    status: true,
    finalizedAt: true,
    payment: { select: { status: true, refundStatus: true } },
} as const;

async function getUnpaidBlockingCandidates(userId: string) {
    return prisma.appointment.findMany({
        where: { userId, status: { in: ["COMPLETED", "NO_SHOW"] } },
        select: UNPAID_CANDIDATE_SELECT,
    });
}

/**
 * Global, not per-modality — see isBlockingUnpaidSession's own comment.
 * An unpaid COMPLETED/NO_SHOW session in any sessionType blocks booking a
 * new appointment of any sessionType.
 */
export async function hasUnpaidCompletedSession(
    userId: string,
): Promise<boolean> {
    const candidates = await getUnpaidBlockingCandidates(userId);
    const now = new Date();
    return candidates.some(c => isBlockingUnpaidSession(c, now));
}

/** The specific appointment triggering the block, for a dashboard/notice
 * CTA that points the patient at what to pay — most recently finalized
 * first. */
export async function getBlockingUnpaidAppointment(userId: string) {
    const now = new Date();
    const appointments = await prisma.appointment.findMany({
        where: { userId, status: { in: ["COMPLETED", "NO_SHOW"] } },
        include: {
            psychologist: { select: { name: true, slug: true } },
            payment: { select: { status: true, refundStatus: true } },
        },
        orderBy: { finalizedAt: "desc" },
    });
    return appointments.find(a => isBlockingUnpaidSession(a, now)) ?? null;
}

/**
 * Per-modality (Fase 7.2) — individual and pareja are independent booking
 * tracks (plan-v2.md's "Decisiones ya tomadas"), so a patient can have an
 * active individual appointment and separately book pareja. Deliberately
 * distinct from hasUnpaidCompletedSession, which stays global (Fase 6).
 */
export async function getActivePatientAppointment(
    userId: string,
    sessionType: SessionType,
) {
    const now = new Date();

    return prisma.appointment.findFirst({
        where: {
            userId,
            sessionType,
            OR: [
                { status: "CONFIRMED", endTime: { gt: now } },
                {
                    status: "PENDING_FORM",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            ],
        },
        include: {
            psychologist: {
                select: { name: true, slug: true },
            },
        },
        orderBy: { dateTime: "asc" },
    });
}

/**
 * The recurring-patient "always your assigned specialist, per modality"
 * rule — derived from appointment history, no new column (same pattern as
 * Fase 6's getPatientTracks). Returns null for a first-time patient in that
 * modality, in which case the match engine picks by load instead.
 */
export async function getAssignedPsychologistForModality(
    userId: string,
    sessionType: SessionType,
): Promise<string | null> {
    const appointment = await prisma.appointment.findFirst({
        where: {
            userId,
            sessionType,
            status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        orderBy: { dateTime: "desc" },
        select: { psychologistId: true },
    });
    return appointment?.psychologistId ?? null;
}
