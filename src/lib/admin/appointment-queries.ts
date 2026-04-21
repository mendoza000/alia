import { prisma } from "@/lib/db";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type AppointmentFilters = {
  status?: AppointmentStatus;
  psychologistId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getAllAppointments(filters: AppointmentFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.psychologistId) {
    where.psychologistId = filters.psychologistId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.dateTime = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59`) } : {}),
    };
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { dateTime: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      psychologist: { select: { id: true, name: true, photoUrl: true } },
      payment: { select: { id: true, finalAmount: true, status: true, couponId: true } },
      intakeForm: { select: { id: true } },
    },
  });
}

export type AppointmentRow = Awaited<ReturnType<typeof getAllAppointments>>[number];

export async function getAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      psychologist: { select: { id: true, name: true, photoUrl: true, specialty: true } },
      payment: true,
      intakeForm: true,
    },
  });
}
