import { prisma } from "@/lib/db";
import { STAFF_ROLES } from "@/lib/auth/permissions";

export async function getStaffUsers() {
    return prisma.user.findMany({
        where: { role: { in: [...STAFF_ROLES] } },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            banned: true,
            createdAt: true,
            psychologistProfile: { select: { id: true, name: true } },
        },
    });
}

/** Psychologists not yet linked to a staff account — the only valid
 * candidates when creating a new `psychologist`-role user, since the link
 * is one-to-one (`Psychologist.userId`). */
export async function getUnlinkedPsychologists() {
    return prisma.psychologist.findMany({
        where: { userId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
    });
}
