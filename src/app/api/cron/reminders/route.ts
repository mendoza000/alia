import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import { sendAppointmentReminder } from "@/lib/email";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = addHours(now, 25);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      dateTime: { gte: now, lte: windowEnd },
    },
    select: { id: true },
  });

  let sent = 0;
  for (const { id } of appointments) {
    try {
      await sendAppointmentReminder(id);
      sent++;
    } catch (err) {
      console.error(`Reminder failed for appointment ${id}:`, err);
    }
  }

  return NextResponse.json({ sent, timestamp: new Date().toISOString() });
}
