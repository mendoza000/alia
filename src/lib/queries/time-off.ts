import { prisma } from "@/lib/db";
import type { TimeOff } from "@/generated/prisma/client";

/** Batched sibling of time-off-actions.ts's getTimeOffOverlapping, for the
 * Fase 7.1 match engine (which isn't admin-scoped, hence living outside
 * that "use server" actions module). */
export async function getTimeOffOverlappingForPsychologists(
    psychologistIds: string[],
    rangeStart: Date,
    rangeEnd: Date,
): Promise<Map<string, TimeOff[]>> {
    if (psychologistIds.length === 0) return new Map();

    const timeOffs = await prisma.timeOff.findMany({
        where: {
            psychologistId: { in: psychologistIds },
            startsAt: { lt: rangeEnd },
            endsAt: { gt: rangeStart },
        },
    });

    const map = new Map<string, TimeOff[]>();
    for (const t of timeOffs) {
        const list = map.get(t.psychologistId) ?? [];
        list.push(t);
        map.set(t.psychologistId, list);
    }
    return map;
}
