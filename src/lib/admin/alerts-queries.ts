import { prisma } from "@/lib/db";

export type AdminAlert = {
  id: string;
  message: string;
  href: string;
};

const FORM_EXPIRY_WINDOW_MS = 30 * 60 * 1000;
const STALE_PAYMENT_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

export async function getAdminAlerts(): Promise<AdminAlert[]> {
  const now = new Date();
  const expiringSoon = new Date(now.getTime() + FORM_EXPIRY_WINDOW_MS);
  const stalePaymentCutoff = new Date(now.getTime() - STALE_PAYMENT_THRESHOLD_MS);

  const [expiringForms, stalePayments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        status: "PENDING_FORM",
        expiresAt: { gt: now, lte: expiringSoon },
      },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.payment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: stalePaymentCutoff },
        appointment: { status: "CONFIRMED" },
      },
      select: {
        id: true,
        appointment: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const alerts: AdminAlert[] = expiringForms.map((appt) => ({
    id: `form-${appt.id}`,
    message: `El formulario de ${appt.user.name} vence en menos de 30 min`,
    href: "/admin/citas",
  }));

  for (const payment of stalePayments) {
    alerts.push({
      id: `payment-${payment.id}`,
      message: `Pago pendiente hace más de 3 días — ${payment.appointment.user.name}`,
      href: "/admin/pagos",
    });
  }

  return alerts;
}
