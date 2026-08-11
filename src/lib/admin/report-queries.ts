import { prisma } from "@/lib/db";

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
  amount: number | null;
  currency: string | null;
};

export type SessionsReportCurrencyTotals = {
  currency: string;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
};

export type SessionsReportPsychologist = {
  id: string;
  name: string;
  sessions: SessionsReportSession[];
  totalsByCurrency: SessionsReportCurrencyTotals[];
};

function getOrCreateCurrencyTotal(
  totals: Map<string, SessionsReportCurrencyTotals>,
  currency: string,
) {
  let entry = totals.get(currency);
  if (!entry) {
    entry = { currency, paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 };
    totals.set(currency, entry);
  }
  return entry;
}

export async function getSessionsReportData(
  filters: SessionsReportFilters,
): Promise<SessionsReportPsychologist[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      dateTime: {
        gte: new Date(filters.dateFrom),
        lte: new Date(`${filters.dateTo}T23:59:59`),
      },
      ...(filters.psychologistId ? { psychologistId: filters.psychologistId } : {}),
    },
    orderBy: { dateTime: "asc" },
    include: {
      user: { select: { name: true } },
      psychologist: { select: { id: true, name: true } },
      payment: { select: { finalAmount: true, currency: true, status: true } },
    },
  });

  const byPsychologist = new Map<
    string,
    { name: string; sessions: SessionsReportSession[]; totals: Map<string, SessionsReportCurrencyTotals> }
  >();

  for (const appt of appointments) {
    let entry = byPsychologist.get(appt.psychologist.id);
    if (!entry) {
      entry = { name: appt.psychologist.name, sessions: [], totals: new Map() };
      byPsychologist.set(appt.psychologist.id, entry);
    }

    const isPaid = appt.payment?.status === "APPROVED";
    const amount = appt.payment?.finalAmount ?? null;
    const currency = appt.payment?.currency ?? null;

    entry.sessions.push({
      id: appt.id,
      dateTime: appt.dateTime,
      patientName: appt.user.name,
      status: appt.status as "CONFIRMED" | "COMPLETED",
      isPaid,
      amount,
      currency,
    });

    if (amount != null && currency != null) {
      const totals = getOrCreateCurrencyTotal(entry.totals, currency);
      if (isPaid) {
        totals.paidAmount += amount;
        totals.paidCount += 1;
      } else {
        totals.pendingAmount += amount;
        totals.pendingCount += 1;
      }
    }
  }

  return Array.from(byPsychologist.entries())
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      sessions: entry.sessions,
      totalsByCurrency: Array.from(entry.totals.values()).sort((a, b) =>
        a.currency.localeCompare(b.currency),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
