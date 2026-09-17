import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { can } from "@/lib/auth/permissions";
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
    // /admin/citas, /admin/pagos and /admin/clientes are all
    // ownership-scoped now (Fase 4.0/4.2) and shown in a psychologist's
    // sidebar — these alerts can safely link there for them too, scoped to
    // their own psychologistId the same way those pages' queries are.
    const psychologistId = can(actor.role, "appointment.read.all")
        ? undefined
        : (actor.psychologistId ?? undefined);
    if (!can(actor.role, "appointment.read.all") && !psychologistId) return [];

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
                    ...(psychologistId ? { psychologistId } : {}),
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
                    appointment: {
                        status: "CONFIRMED",
                        ...(psychologistId ? { psychologistId } : {}),
                    },
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
                    ...(psychologistId ? { psychologistId } : {}),
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
            href: "/admin/clientes",
        });
    }

    return alerts;
}
