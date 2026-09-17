import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/require";

export type AdminAlert = {
    id: string;
    message: string;
    detail: string;
    href: string;
};

const FORM_EXPIRY_WINDOW_MS = 30 * 60 * 1000;
const STALE_PAYMENT_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;
const SELF_BOOKED_ALERT_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

export async function getAdminAlerts(actor: Actor): Promise<AdminAlert[]> {
    // Every alert here links to /admin/citas, /admin/pagos or
    // /admin/formularios — pages whose list queries aren't ownership-scoped
    // yet (that's Fase 4.3) and that a psychologist's sidebar deliberately
    // doesn't show yet (Fase 1.3). Surfacing these to a psychologist today
    // would either point at a page they can't reach or, worse, one that
    // still renders every patient's data unfiltered. Their own dashboard
    // already covers "sus sesiones de hoy" directly, so this defers to
    // Fase 4 instead of half-wiring a broken/leaky notification.
    if (actor.role === "psychologist") return [];

    const now = new Date();
    const expiringSoon = new Date(now.getTime() + FORM_EXPIRY_WINDOW_MS);
    const stalePaymentCutoff = new Date(
        now.getTime() - STALE_PAYMENT_THRESHOLD_MS,
    );
    const selfBookedCutoff = new Date(
        now.getTime() - SELF_BOOKED_ALERT_WINDOW_MS,
    );

    const [expiringForms, stalePayments, selfBookedAppointments] =
        await Promise.all([
            prisma.appointment.findMany({
                where: {
                    status: "PENDING_FORM",
                    expiresAt: { gt: now, lte: expiringSoon },
                },
                select: {
                    id: true,
                    expiresAt: true,
                    dateTime: true,
                    user: { select: { name: true } },
                    psychologist: { select: { name: true } },
                },
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
                    createdAt: true,
                    appointment: {
                        select: {
                            dateTime: true,
                            user: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.appointment.findMany({
                where: {
                    status: "CONFIRMED",
                    selfBookedAt: { gte: selfBookedCutoff },
                },
                select: {
                    id: true,
                    selfBookedAt: true,
                    dateTime: true,
                    user: { select: { name: true } },
                    psychologist: { select: { name: true } },
                },
                orderBy: { selfBookedAt: "asc" },
            }),
        ]);

    const alerts: AdminAlert[] = expiringForms
        .filter(
            (appt): appt is typeof appt & { expiresAt: Date } =>
                appt.expiresAt !== null,
        )
        .map(appt => {
            const minutesLeft = Math.max(
                1,
                Math.round((appt.expiresAt.getTime() - now.getTime()) / 60_000),
            );
            return {
                id: `form-${appt.id}`,
                message: `El formulario de ${appt.user.name} vence en ${minutesLeft} min`,
                detail: `Sesión con ${appt.psychologist.name} · ${format(appt.dateTime, "d MMM, HH:mm", { locale: es })}`,
                href: "/admin/citas",
            };
        });

    for (const payment of stalePayments) {
        const daysElapsed = Math.floor(
            (now.getTime() - payment.createdAt.getTime()) /
                (24 * 60 * 60 * 1000),
        );
        alerts.push({
            id: `payment-${payment.id}`,
            message: `Pago pendiente hace ${daysElapsed} días — ${payment.appointment.user.name}`,
            detail: `Sesión del ${format(payment.appointment.dateTime, "d MMM, HH:mm", { locale: es })}`,
            href: "/admin/pagos",
        });
    }

    for (const appt of selfBookedAppointments) {
        alerts.push({
            id: `self-booked-${appt.id}`,
            message: `Nuevo paciente agendado sin intervención — ${appt.user.name}`,
            detail: `Sesión con ${appt.psychologist.name} · ${format(appt.dateTime, "d MMM, HH:mm", { locale: es })}`,
            href: "/admin/formularios",
        });
    }

    return alerts;
}
