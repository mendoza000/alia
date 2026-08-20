import { prisma } from "@/lib/db";

export async function getPatientAppointments(userId: string) {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            psychologist: {
                select: { name: true, slug: true, photoUrl: true },
            },
            intakeForm: { select: { data: true } },
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
            intakeForm: { select: { data: true } },
        },
        orderBy: { dateTime: "asc" },
    });
}
