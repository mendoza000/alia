import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import type { IntakeFormData } from "@/lib/validators/intake-form";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const intakeForms = await prisma.intakeForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      appointment: {
        select: {
          dateTime: true,
          psychologist: { select: { name: true } },
        },
      },
    },
  });

  const csvHeaders = [
    "Paciente",
    "Email",
    "Psicólogo",
    "Fecha cita",
    "Formulario enviado",
    "Teléfono",
    "Fecha nacimiento",
    "Género",
    "Estado civil",
    "Ocupación",
    "Motivo consulta",
    "Terapia previa",
    "Medicación",
    "Expectativas",
  ];

  function escape(value: string | undefined | null): string {
    if (!value) return "";
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  const rows = intakeForms.map((f) => {
    const data = f.data as unknown as IntakeFormData;
    return [
      escape(f.user.name),
      escape(f.user.email),
      escape(f.appointment.psychologist.name),
      escape(format(f.appointment.dateTime, "yyyy-MM-dd HH:mm")),
      escape(format(f.createdAt, "yyyy-MM-dd HH:mm")),
      escape(data.phone),
      escape(data.dateOfBirth),
      escape(data.gender),
      escape(data.maritalStatus),
      escape(data.occupation),
      escape(data.consultationReason),
      escape(data.previousTherapy),
      escape(data.currentMedication),
      escape(data.therapyExpectations),
    ].join(",");
  });

  const csv = [csvHeaders.map((h) => `"${h}"`).join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="formularios-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
