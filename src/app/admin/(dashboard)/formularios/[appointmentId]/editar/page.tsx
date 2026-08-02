import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { EditIntakeForm } from "@/components/admin/edit-intake-form";
import type { IntakeFormData } from "@/lib/validators/intake-form";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  params: Promise<{ appointmentId: string }>;
};

export default async function EditarFormularioPage({ params }: Props) {
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      intakeForm: true,
      user: { select: { name: true } },
    },
  });

  if (!appointment?.intakeForm) notFound();

  const formData = appointment.intakeForm.data as unknown as IntakeFormData;

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/formularios/${appointmentId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Volver al formulario
      </Link>
      <h1 className="mb-6 font-heading text-2xl font-semibold">
        Editar formulario de {appointment.user.name}
      </h1>
      <EditIntakeForm appointmentId={appointmentId} data={formData} />
    </div>
  );
}
