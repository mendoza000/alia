import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { IntakeFormData } from "@/lib/validators/intake-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";

type IntakeFormDetailProps = {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  psychologistName: string;
  appointmentDate: Date;
  submittedAt: Date;
  data: IntakeFormData;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-base font-semibold text-foreground border-b border-border pb-1">
        {title}
      </h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : value;

  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm">{display}</p>
    </div>
  );
}

export function IntakeFormDetail({
  appointmentId,
  patientName,
  patientEmail,
  psychologistName,
  appointmentDate,
  submittedAt,
  data,
}: IntakeFormDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/formularios"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Volver a formularios
          </Link>
          <h1 className="font-heading text-2xl font-semibold">{patientName}</h1>
          <p className="text-sm text-muted-foreground">{patientEmail}</p>
        </div>
        <a href={`/api/admin/formularios/${appointmentId}/pdf`} target="_blank">
          <Button variant="outline" size="sm" className="gap-2">
            <DownloadIcon className="size-4" />
            Exportar PDF
          </Button>
        </a>
      </div>

      {/* Meta */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Psicólogo</p>
          <p className="font-medium">{psychologistName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha de cita</p>
          <p className="font-medium capitalize">
            {format(appointmentDate, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Enviado</p>
          <p className="font-medium">
            {format(submittedAt, "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      <Separator />

      {/* Form data */}
      <div className="space-y-8">
        <Section title="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre completo" value={data.fullName} />
            <Field label="Correo electrónico" value={data.email} />
            <Field label="Teléfono" value={data.phone} />
            <Field label="Fecha de nacimiento" value={data.dateOfBirth} />
            <Field label="Género" value={data.gender} />
            <Field label="Estado civil" value={data.maritalStatus} />
            <Field label="Ocupación" value={data.occupation} />
          </div>
        </Section>

        <Section title="Motivo de consulta">
          <Field label="¿Por qué buscas terapia?" value={data.consultationReason} />
        </Section>

        <Section title="Historial de salud mental">
          <Field label="¿Has tenido tratamiento psicológico previo?" value={data.previousTherapy} />
          {data.previousTherapy === "Sí" && (
            <Field label="Detalles del tratamiento previo" value={data.previousTherapyDetails} />
          )}
          <Field label="¿Tomas medicación actualmente?" value={data.currentMedication} />
          {data.currentMedication === "Sí" && (
            <Field label="Medicación actual" value={data.currentMedicationDetails} />
          )}
        </Section>

        <Section title="Historial médico">
          <Field label="Enfermedades o condiciones médicas relevantes" value={data.medicalHistory || "Ninguna"} />
        </Section>

        <Section title="Red de apoyo">
          <Field label="¿Con quién vives?" value={data.livingWith || "No especificado"} />
          <Field label="Red de apoyo" value={data.supportNetwork || "No especificado"} />
        </Section>

        <Section title="Expectativas de terapia">
          <Field label="¿Qué esperas lograr con la terapia?" value={data.therapyExpectations} />
        </Section>

        <Section title="Consentimientos">
          <Field label="Consentimiento informado" value={data.informedConsent} />
          <Field label="Política de privacidad" value={data.privacyPolicy} />
        </Section>
      </div>
    </div>
  );
}
