import { prisma } from "@/lib/db";
import type { SessionType } from "@/generated/prisma/enums";

export type AssignedPsychologist = {
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
    specialty: string;
};

type TrackRow = {
    sessionType: SessionType;
    status: string;
    dateTime: Date;
    psychologist: AssignedPsychologist;
};

/**
 * Pure reduction, same "derived, no extra column" pattern already used by
 * patient-queries.ts's own `tracks` field: the assigned specialist per
 * modality is derived from appointment history, not a stored column, so it
 * never desyncs from what actually happened. Expects rows already sorted by
 * dateTime desc — the first CONFIRMED/COMPLETED row per sessionType wins; a
 * more recent CANCELLED row never overrides an earlier real one.
 */
export function deriveTracksFromAppointments(
    rows: TrackRow[],
): Partial<Record<SessionType, AssignedPsychologist>> {
    const tracks: Partial<Record<SessionType, AssignedPsychologist>> = {};
    for (const row of rows) {
        if (
            (row.status === "CONFIRMED" || row.status === "COMPLETED") &&
            !tracks[row.sessionType]
        ) {
            tracks[row.sessionType] = row.psychologist;
        }
    }
    return tracks;
}

async function getTrackRows(userId: string): Promise<TrackRow[]> {
    return prisma.appointment.findMany({
        where: { userId },
        orderBy: { dateTime: "desc" },
        select: {
            sessionType: true,
            status: true,
            dateTime: true,
            psychologist: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    photoUrl: true,
                    specialty: true,
                },
            },
        },
    });
}

export async function getPatientTracks(
    userId: string,
): Promise<Partial<Record<SessionType, AssignedPsychologist>>> {
    const rows = await getTrackRows(userId);
    return deriveTracksFromAppointments(rows);
}

export async function getAssignedPsychologistId(
    userId: string,
    sessionType: SessionType,
): Promise<string | null> {
    const tracks = await getPatientTracks(userId);
    return tracks[sessionType]?.id ?? null;
}
