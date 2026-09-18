import { prisma } from "@/lib/db";
import { isBlockingUnpaidSession } from "@/lib/patient/unpaid-session";

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

export async function getActivePatientAppointment(userId: string) {
    const now = new Date();

    return prisma.appointment.findFirst({
        where: {
            userId,
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
