export type DateFilterPeriod = "today" | "month" | "3months" | "6months" | "year" | "all";

export type DateRange = { since: Date | null; until: Date | null };

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPeriodStart(period: DateFilterPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "today":
      return startOfToday();
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "3months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 2);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "6months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

export function resolveDateRange(
  period: DateFilterPeriod,
  dateFrom?: string,
  dateTo?: string,
): DateRange {
  const since = dateFrom ? new Date(dateFrom) : getPeriodStart(period);
  const until = dateTo
    ? new Date(`${dateTo}T23:59:59`)
    : period === "today" && !dateFrom
      ? endOfToday()
      : null;
  return { since, until };
}
