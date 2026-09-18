import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/auth/require";
import { can } from "@/lib/auth/permissions";
import type { ApprovalStatus, ApprovalType } from "@/generated/prisma/enums";

export type ApprovalRow = {
    id: string;
    type: ApprovalType;
    status: ApprovalStatus;
    requestedBy: { id: string; name: string };
    createdAt: Date;
    decidedBy: { id: string; name: string } | null;
    decidedAt: Date | null;
    decisionNote: string | null;
    payload: Record<string, unknown>;
    patientName: string | null;
    psychologistName: string | null;
    appointmentDateTime: Date | null;
    currency: string | null;
};

/**
 * ApprovalRequest.targetId is deliberately not an FK (polymorphic — an
 * appointmentId for CUSTOM_PAYMENT_AMOUNT, a paymentId for REFUND_REQUEST),
 * so display context is batch-resolved by type here instead of via a Prisma
 * relation, to avoid N+1 lookups.
 */
export async function getApprovals(actor: Actor): Promise<ApprovalRow[]> {
    const where = can(actor.role, "approval.decide")
        ? {}
        : { requestedByUserId: actor.userId };

    const requests = await prisma.approvalRequest.findMany({
        where,
        include: {
            requestedBy: { select: { id: true, name: true } },
            decidedBy: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const appointmentIds = requests
        .filter(r => r.type === "CUSTOM_PAYMENT_AMOUNT")
        .map(r => r.targetId);
    const paymentIds = requests
        .filter(r => r.type === "REFUND_REQUEST")
        .map(r => r.targetId);

    const [appointments, payments] = await Promise.all([
        appointmentIds.length
            ? prisma.appointment.findMany({
                  where: { id: { in: appointmentIds } },
                  select: {
                      id: true,
                      dateTime: true,
                      user: { select: { name: true } },
                      psychologist: { select: { name: true } },
                  },
              })
            : Promise.resolve([]),
        paymentIds.length
            ? prisma.payment.findMany({
                  where: { id: { in: paymentIds } },
                  select: {
                      id: true,
                      currency: true,
                      appointment: {
                          select: {
                              dateTime: true,
                              user: { select: { name: true } },
                              psychologist: { select: { name: true } },
                          },
                      },
                  },
              })
            : Promise.resolve([]),
    ]);

    const appointmentById = new Map(appointments.map(a => [a.id, a]));
    const paymentById = new Map(payments.map(p => [p.id, p]));

    return requests.map(r => {
        if (r.type === "CUSTOM_PAYMENT_AMOUNT") {
            const appointment = appointmentById.get(r.targetId);
            return {
                id: r.id,
                type: r.type,
                status: r.status,
                requestedBy: r.requestedBy,
                createdAt: r.createdAt,
                decidedBy: r.decidedBy,
                decidedAt: r.decidedAt,
                decisionNote: r.decisionNote,
                payload: r.payload as Record<string, unknown>,
                patientName: appointment?.user.name ?? null,
                psychologistName: appointment?.psychologist.name ?? null,
                appointmentDateTime: appointment?.dateTime ?? null,
                currency: (r.payload as { currency?: string }).currency ?? null,
            };
        }

        const payment = paymentById.get(r.targetId);
        return {
            id: r.id,
            type: r.type,
            status: r.status,
            requestedBy: r.requestedBy,
            createdAt: r.createdAt,
            decidedBy: r.decidedBy,
            decidedAt: r.decidedAt,
            decisionNote: r.decisionNote,
            payload: r.payload as Record<string, unknown>,
            patientName: payment?.appointment.user.name ?? null,
            psychologistName: payment?.appointment.psychologist.name ?? null,
            appointmentDateTime: payment?.appointment.dateTime ?? null,
            currency: payment?.currency ?? null,
        };
    });
}
