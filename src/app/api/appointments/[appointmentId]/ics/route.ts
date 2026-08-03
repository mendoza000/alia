import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildIcsContent } from "@/lib/calendar/ics";

export const dynamic = "force-dynamic";

function isAndroid(userAgent: string | null): boolean {
  return !!userAgent && /Android/i.test(userAgent);
}

function buildGoogleCalendarUrl(
  dateTime: Date,
  endTime: Date,
  psychologistName: string,
): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Sesión ALIA — ${psychologistName}`,
    dates: `${fmt(dateTime)}/${fmt(endTime)}`,
    details: `Sesión de acompañamiento con ${psychologistName} a través de ALIA`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { psychologist: { select: { name: true } } },
  });

  if (!appointment) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  if (isAndroid(req.headers.get("user-agent"))) {
    return NextResponse.redirect(
      buildGoogleCalendarUrl(
        appointment.dateTime,
        appointment.endTime,
        appointment.psychologist.name,
      ),
    );
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
