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
      user: { select: { name: true, email: true, intakeForm: true } },
      psychologist: { select: { name: true } },
    },
  });

  if (!appointment?.user.intakeForm) notFound();

  const intakeForm = appointment.user.intakeForm;
  const formData = intakeForm.data as unknown as IntakeFormData;

  return (
    <div className="max-w-3xl">
      <IntakeFormDetail
        appointmentId={appointmentId}
        patientName={appointment.user.name}
        patientEmail={appointment.user.email}
        psychologistName={appointment.psychologist.name}
        appointmentDate={appointment.dateTime}
        patientTimezone={appointment.timezone}
        submittedAt={intakeForm.createdAt}
        data={formData}
        clinicalDataRedactedAt={intakeForm.clinicalDataRedactedAt}
      />
    </div>
  );
}
