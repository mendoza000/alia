import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, Clock, DollarSign, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getPsychologistById } from "@/lib/admin/psychologist-queries";
import { PsychologistDetailHeader } from "@/components/admin/psychologist-detail-header";
import { ScheduleEditor } from "@/components/admin/schedule-editor";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
  }).format(date);
}

export default async function PsychologistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const psychologist = await getPsychologistById(id);

  if (!psychologist) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/psicologos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Psicólogos
      </Link>

      <PsychologistDetailHeader psychologist={psychologist} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bio */}
          {psychologist.bio && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold">
                Biografía
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {psychologist.bio}
              </p>
            </div>
          )}

          {/* Schedule */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="font-heading text-lg font-semibold">
                Horarios semanales
              </h2>
              <p className="text-sm text-muted-foreground">
                Configura los bloques de disponibilidad por día
              </p>
            </div>
            <ScheduleEditor
              psychologistId={psychologist.id}
              initialSchedules={psychologist.schedules}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">
              Datos de contacto
            </h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  Correo electrónico
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {psychologist.email}
                </dd>
              </div>
              {psychologist.phone && (
                <div>
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />
                    Teléfono
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {psychologist.phone}
                  </dd>
                </div>
              )}
              {psychologist.calendarId && (
                <div>
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Google Calendar ID
                  </dt>
                  <dd className="mt-0.5 truncate text-sm text-muted-foreground">
                    {psychologist.calendarId}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Session details */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">
              Detalles de sesión
            </h2>
            <dl className="mt-3 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="size-4 text-muted-foreground" />
                <dt className="text-muted-foreground">Tarifa:</dt>
                <dd className="font-medium">
                  {formatCOP(psychologist.sessionRate)}
                </dd>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <dt className="text-muted-foreground">Duración:</dt>
                <dd className="font-medium">
                  {psychologist.sessionDuration} minutos
                </dd>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="size-4 text-muted-foreground" />
                <dt className="text-muted-foreground">Slug:</dt>
                <dd className="text-muted-foreground">{psychologist.slug}</dd>
              </div>
            </dl>
          </div>

          {/* Activity */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Actividad</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Creado</dt>
                <dd className="font-medium">
                  {formatDate(psychologist.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Actualizado</dt>
                <dd className="font-medium">
                  {formatDate(psychologist.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
