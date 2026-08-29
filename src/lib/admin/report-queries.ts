import { prisma } from "@/lib/db";
import { getPaymentAmountUsd, getUsdRateMap } from "@/lib/exchange-rates";

export type SessionsReportFilters = {
    psychologistId?: string;
    dateFrom: string;
    dateTo: string;
};

export type SessionsReportSession = {
    id: string;
    dateTime: Date;
    patientName: string;
    status: "CONFIRMED" | "COMPLETED";
    isPaid: boolean;
    amountUsd: number | null;
};

export type SessionsReportTotals = {
    paidAmountUsd: number;
    paidCount: number;
    pendingAmountUsd: number;
    pendingCount: number;
};

export type SessionsReportPsychologist = {
    id: string;
    name: string;
    sessions: SessionsReportSession[];
    totals: SessionsReportTotals;
};

function getPayoutUsd(
    payment: {
        finalAmount: number;
        currency: string;
        exchangeRateToUsd: number | null;
        stripeSettledAmountUsd: number | null;
        payoutRatePercent: number | null;
        payoutAmountUsd: number | null;
    } | null,
    rates: Map<string, number>,
): number | null {
    if (!payment) return null;
    if (payment.payoutAmountUsd != null) return payment.payoutAmountUsd;
    if (payment.payoutRatePercent == null) return null;

    const finalAmountUsd = getPaymentAmountUsd(payment, rates);
    return finalAmountUsd * (payment.payoutRatePercent / 100);
}

export async function getSessionsReportData(
    filters: SessionsReportFilters,
): Promise<SessionsReportPsychologist[]> {
    const [appointments, rates] = await Promise.all([
        prisma.appointment.findMany({
            where: {
                status: { in: ["CONFIRMED", "COMPLETED"] },
                dateTime: {
                    gte: new Date(filters.dateFrom),
                    lte: new Date(`${filters.dateTo}T23:59:59`),
                },
                ...(filters.psychologistId
                    ? { psychologistId: filters.psychologistId }
                    : {}),
            },
            orderBy: { dateTime: "asc" },
            include: {
                user: { select: { name: true } },
                psychologist: { select: { id: true, name: true } },
                payment: {
                    select: {
                        finalAmount: true,
                        currency: true,
                        status: true,
                        exchangeRateToUsd: true,
                        stripeSettledAmountUsd: true,
                        payoutRatePercent: true,
                        payoutAmountUsd: true,
                    },
                },
            },
        }),
        getUsdRateMap(),
    ]);

    const byPsychologist = new Map<
        string,
        {
            name: string;
            sessions: SessionsReportSession[];
            totals: SessionsReportTotals;
        }
    >();

    for (const appt of appointments) {
        let entry = byPsychologist.get(appt.psychologist.id);
        if (!entry) {
            entry = {
                name: appt.psychologist.name,
                sessions: [],
                totals: {
                    paidAmountUsd: 0,
                    paidCount: 0,
                    pendingAmountUsd: 0,
                    pendingCount: 0,
                },
            };
            byPsychologist.set(appt.psychologist.id, entry);
        }

        const isPaid = appt.payment?.status === "APPROVED";
        const amountUsd = getPayoutUsd(appt.payment, rates);

        entry.sessions.push({
            id: appt.id,
            dateTime: appt.dateTime,
            patientName: appt.user.name,
            status: appt.status as "CONFIRMED" | "COMPLETED",
            isPaid,
            amountUsd,
        });

        if (amountUsd != null) {
            if (isPaid) {
                entry.totals.paidAmountUsd += amountUsd;
                entry.totals.paidCount += 1;
            } else {
                entry.totals.pendingAmountUsd += amountUsd;
                entry.totals.pendingCount += 1;
            }
        }
    }

    return Array.from(byPsychologist.entries())
        .map(([id, entry]) => ({
            id,
            name: entry.name,
            sessions: entry.sessions,
            totals: entry.totals,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
