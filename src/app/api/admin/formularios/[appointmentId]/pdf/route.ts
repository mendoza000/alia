import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type JSX } from "react";
import { Document } from "@react-pdf/renderer";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IntakeFormPDF } from "@/components/admin/intake-form-pdf";
import type { IntakeFormData } from "@/lib/validators/intake-form";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      intakeForm: true,
      user: { select: { name: true, email: true } },
      psychologist: { select: { name: true } },
    },
  });

  if (!appointment?.intakeForm) {
    return new NextResponse("Formulario no encontrado", { status: 404 });
  }

  const formData = appointment.intakeForm.data as unknown as IntakeFormData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(IntakeFormPDF, {
    patientName: appointment.user.name,
    patientEmail: appointment.user.email,
    psychologistName: appointment.psychologist.name,
    appointmentDate: appointment.dateTime,
    submittedAt: appointment.intakeForm.createdAt,
    data: formData,
  }) as JSX.Element as Parameters<typeof renderToBuffer>[0];

  const buffer = await renderToBuffer(element);

  const filename = `formulario-${appointment.user.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
