import { Suspense } from "react";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import {
  getAllAppointments,
  type AppointmentFilters,
} from "@/lib/admin/appointment-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { getAllRates } from "@/lib/admin/payment-rate-queries";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { AppointmentsFilters } from "@/components/admin/appointments-filters";
import { NewManualAppointmentDialog } from "@/components/admin/new-manual-appointment-dialog";
import { GenerateReportDialog } from "@/components/admin/generate-report-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  searchParams: Promise<{
    status?: string;
    psychologistId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function CitasPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: AppointmentFilters = {
    status: params.status as AppointmentStatus | undefined,
    psychologistId: params.psychologistId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const [appointments, psychologists, rates] = await Promise.all([
    getAllAppointments(filters),
    getAllPsychologists(),
    getAllRates(),
  ]);

  const psychologistOptions = psychologists.map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const availableCurrencies = rates.map((r) => r.currency);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sesiones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona todas las sesiones de la plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GenerateReportDialog psychologists={psychologistOptions} />
          <NewManualAppointmentDialog psychologists={psychologistOptions} />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-9 w-96" />}>
        <AppointmentsFilters psychologists={psychologistOptions} />
      </Suspense>

      <AppointmentsTable
        appointments={appointments}
        availableCurrencies={availableCurrencies}
      />
    </div>
  );
}
