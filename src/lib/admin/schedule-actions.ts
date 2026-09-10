"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireActor, requireScheduleAccess } from "@/lib/auth/require";
import {
    schedulesSchema,
    type ScheduleBlockData,
} from "@/lib/validators/schedule";

export async function saveSchedules(
    psychologistId: string,
    blocks: ScheduleBlockData[],
) {
    const actor = await requireActor();
    await requireScheduleAccess(actor, psychologistId);

    const validated = await schedulesSchema.validate(blocks, {
        abortEarly: false,
    });

    if (!validated) return;

    await prisma.$transaction([
        prisma.schedule.deleteMany({ where: { psychologistId } }),
        ...validated.map(block =>
            prisma.schedule.create({
                data: {
                    psychologistId,
                    dayOfWeek: block.dayOfWeek,
                    startTime: block.startTime,
                    endTime: block.endTime,
                    isActive: block.isActive,
                },
            }),
        ),
    ]);

    revalidatePath("/admin/psicologos", "layout");
    revalidatePath(`/admin/psicologos/${psychologistId}`);
}
