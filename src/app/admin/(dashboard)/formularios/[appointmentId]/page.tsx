import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { IntakeFormDetail } from "@/components/admin/intake-form-detail";
import type { IntakeFormData } from "@/lib/validators/intake-form";

type Props = {
  params: Promise<{ appointmentId: string }>;
};

export default async function FormularioDetailPage({ params }: Props) {
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      intakeForm: true,
      user: { select: { name: true, email: true } },
      psychologist: { select: { name: true } },
    },
  });

  if (!appointment?.intakeForm) notFound();

  const formData = appointment.intakeForm.data as unknown as IntakeFormData;

  return (
    <div className="max-w-3xl">
      <IntakeFormDetail
        appointmentId={appointmentId}
        patientName={appointment.user.name}
        patientEmail={appointment.user.email}
        psychologistName={appointment.psychologist.name}
        appointmentDate={appointment.dateTime}
        submittedAt={appointment.intakeForm.createdAt}
        data={formData}
      />
    </div>
  );
}
