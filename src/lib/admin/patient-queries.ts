import { prisma } from "@/lib/db";
import type { SessionType } from "@/generated/prisma/enums";

export type PatientFilters = {
    /** Free-text match on name or email. */
    search?: string;
    /** Only patients with at least one appointment with this psychologist.
     * A psychologist actor is always forced to their own id by the caller
     * (same resolvePsychologistScope pattern as citas/pagos) — this
     * function itself doesn't enforce scope, it just applies whatever
     * filter it's given. */
    psychologistId?: string;
    sessionType?: SessionType;
    joinedFrom?: Date;
    joinedTo?: Date;
};

/**
 * One shared query for both the admin/assistant (unscoped) and
 * psychologist (own-only) views of "Clientes" — the scoping decision
 * lives at the page level via resolvePsychologistScope, same as
 * getAllAppointments/getAllPayments, rather than two separately-named
 * functions duplicating the same Prisma query.
 */
export async function getPatients(filters: PatientFilters = {}) {
    const users = await prisma.user.findMany({
        where: {
            role: "patient",
            ...(filters.search
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.search,
                                  mode: "insensitive",
                              },
                          },
                          {
                              email: {
                                  contains: filters.search,
                                  mode: "insensitive",
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.joinedFrom || filters.joinedTo
                ? {
                      createdAt: {
                          ...(filters.joinedFrom
                              ? { gte: filters.joinedFrom }
                              : {}),
                          ...(filters.joinedTo
                              ? { lte: filters.joinedTo }
                              : {}),
                      },
                  }
                : {}),
            appointments: {
                some: {
                    ...(filters.psychologistId
                        ? { psychologistId: filters.psychologistId }
                        : {}),
                    ...(filters.sessionType
                        ? { sessionType: filters.sessionType }
                        : {}),
                },
            },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            appointments: {
                orderBy: { dateTime: "desc" },
                select: {
                    id: true,
                    dateTime: true,
                    status: true,
                    sessionType: true,
                    psychologist: { select: { id: true, name: true } },
                },
            },
            intakeForm: { select: { id: true, createdAt: true } },
        },
    });

    const now = new Date();

    return users.map(u => {
        const past = u.appointments.filter(a => a.dateTime < now);
        const upcoming = u.appointments.filter(a => a.dateTime >= now);

        // Assigned psychologist per modality: the most recent
        // CONFIRMED/COMPLETED appointment for that sessionType — same
        // "derived, no extra column" rule the plan already uses elsewhere
        // for patient-assignment (Fase 6), applied here for the list view.
        const tracks: Partial<
            Record<SessionType, { id: string; name: string }>
        > = {};
        for (const a of u.appointments) {
            if (
                (a.status === "CONFIRMED" || a.status === "COMPLETED") &&
                !tracks[a.sessionType]
            ) {
                tracks[a.sessionType] = a.psychologist;
            }
        }

        return {
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            pastAppointmentCount: past.length,
            upcomingAppointmentCount: upcoming.length,
            mostRecentAppointment: u.appointments[0] ?? null,
            tracks,
            hasIntakeForm: !!u.intakeForm,
        };
    });
}

export type PatientRow = Awaited<ReturnType<typeof getPatients>>[number];

export async function getPatientDetail(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId, role: "patient" },
        include: {
            intakeForm: true,
            appointments: {
                orderBy: { dateTime: "desc" },
                include: {
                    psychologist: {
                        select: {
                            id: true,
                            name: true,
                            whatsappReminderTemplate: true,
                            whatsappTodaySessionTemplate: true,
                        },
                    },
                    payment: {
                        select: {
                            id: true,
                            finalAmount: true,
                            currency: true,
                            status: true,
                            isNoShowFee: true,
                            paidAt: true,
                        },
                    },
                },
            },
        },
    });
    if (!user) return null;

    const notes = await prisma.patientNote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { psychologist: { select: { name: true } } },
    });

    return { ...user, notes };
}
