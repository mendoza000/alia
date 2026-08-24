import { prisma } from "@/lib/db";

export async function getLatestIntakeFormByUser(userId: string) {
    return prisma.intakeForm.findUnique({
        where: { userId },
        select: { data: true },
    });
}
