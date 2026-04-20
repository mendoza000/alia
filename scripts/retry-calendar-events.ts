/**
 * Retry Google Calendar event creation for CONFIRMED appointments with no googleEventId.
 * Run once after fixing calendar permissions:
 *   bun --env-file=.env run scripts/retry-calendar-events.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createCalendarEvent } from "../src/lib/google-calendar";

const dbUrl = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const appointments = await prisma.appointment.findMany({
  where: { status: "CONFIRMED", googleEventId: null },
  include: {
    psychologist: { select: { calendarId: true, name: true } },
    user: { select: { name: true, email: true } },
  },
});

console.log(`Found ${appointments.length} appointments to retry.`);

for (const appt of appointments) {
  if (!appt.psychologist.calendarId) {
    console.log(`[SKIP] ${appt.id} — psychologist has no calendarId`);
    continue;
  }

  const patientName = appt.user.name ?? appt.user.email;

  const eventId = await createCalendarEvent(appt.psychologist.calendarId, {
    summary: `Consulta — ${patientName}`,
    description: [
      `Paciente: ${patientName}`,
      `Email: ${appt.user.email}`,
      `Formulario: ${baseUrl}/admin/formularios/${appt.id}`,
    ].join("\n"),
    startDateTime: appt.dateTime,
    endDateTime: appt.endTime,
  });

  if (eventId) {
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { googleEventId: eventId },
    });
    console.log(`[OK] ${appt.id} → eventId: ${eventId}`);
  } else {
    console.log(`[FAIL] ${appt.id} — createCalendarEvent returned null`);
  }
}

await pool.end();
