import { prisma } from "@/lib/db";

export async function getLatestIntakeFormByUser(userId: string) {
    return prisma.intakeForm.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { data: true },
    });
}
