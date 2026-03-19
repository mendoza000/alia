import { prisma } from "@/lib/db";

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
            sessionRate: true,
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
