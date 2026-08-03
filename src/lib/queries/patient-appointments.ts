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
