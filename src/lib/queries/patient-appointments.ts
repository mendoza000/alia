import { prisma } from "@/lib/db";

export async function getPatientAppointments(userId: string) {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            psychologist: {
                select: { name: true, slug: true, photoUrl: true },
            },
        },
        orderBy: { dateTime: "desc" },
    });
}
