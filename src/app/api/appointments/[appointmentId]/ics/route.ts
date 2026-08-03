import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildIcsContent } from "@/lib/calendar/ics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const { appointmentId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { psychologist: { select: { name: true } } },
  });

  if (!appointment || appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const ics = buildIcsContent({
    uid: appointment.id,
    dateTime: appointment.dateTime,
    endTime: appointment.endTime,
    summary: `Sesión ALIA — ${appointment.psychologist.name}`,
    description: `Sesión de acompañamiento con ${appointment.psychologist.name} a través de ALIA`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sesion-alia.ics"',
    },
  });
}
