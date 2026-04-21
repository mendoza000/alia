import { prisma } from "@/lib/db";

export type FinancePeriod = "month" | "3months" | "6months" | "year";

function getPeriodStart(period: FinancePeriod): Date {
  const now = new Date();
  switch (period) {
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
  }
}

export async function getFinanceByPsychologist(period: FinancePeriod = "month") {
  const since = getPeriodStart(period);

  const psychologists = await prisma.psychologist.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      specialty: true,
      appointments: {
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          dateTime: { gte: since },
        },
        select: {
          payment: {
            select: { finalAmount: true, status: true },
          },
        },
      },
    },
  });

  return psychologists
    .map((p) => {
      const approvedPayments = p.appointments
        .map((a) => a.payment)
        .filter((pay) => pay?.status === "APPROVED");

      const totalRevenue = approvedPayments.reduce(
        (sum, pay) => sum + (pay?.finalAmount ?? 0),
        0,
      );
      const sessionCount = approvedPayments.length;

      return {
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        specialty: p.specialty,
        totalRevenue,
        sessionCount,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export type FinancePsychologist = Awaited<ReturnType<typeof getFinanceByPsychologist>>[number];

export async function getFinanceSummary(period: FinancePeriod = "month") {
  const since = getPeriodStart(period);

  const result = await prisma.payment.aggregate({
    _sum: { finalAmount: true, discountAmount: true },
    _count: { id: true },
    where: {
      status: "APPROVED",
      paidAt: { gte: since },
    },
  });

  const totalRevenue = result._sum.finalAmount ?? 0;
  const totalSessions = result._count.id;
  const totalDiscounts = result._sum.discountAmount ?? 0;
  const avgSession = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;

  return { totalRevenue, totalSessions, totalDiscounts, avgSession };
}
