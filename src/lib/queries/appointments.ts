import { prisma } from "@/lib/db";

export async function getBlockingAppointments(
    psychologistId: string,
    timeMin: Date,
    timeMax: Date,
) {
    const now = new Date();

    return prisma.appointment.findMany({
        where: {
            psychologistId,
            dateTime: { lt: timeMax },
            endTime: { gt: timeMin },
            OR: [
                { status: "CONFIRMED" },
                {
                    status: "PENDING_FORM",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
            ],
        },
        select: { dateTime: true, endTime: true },
    });
}
