import { prisma } from "@/lib/db";

export async function getAllPsychologists() {
  return prisma.psychologist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          appointments: true,
          schedules: true,
        },
      },
    },
  });
}

export async function getPsychologistById(id: string) {
  return prisma.psychologist.findUnique({
    where: { id },
    include: {
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });
}
