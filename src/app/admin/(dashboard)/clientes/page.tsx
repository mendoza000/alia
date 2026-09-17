import { Suspense } from "react";
import { getPatients } from "@/lib/admin/patient-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { PatientTable } from "@/components/admin/patient-table";
import { ClientFilters } from "@/components/admin/client-filters";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/lib/auth/permissions";
import { requireActor, resolvePsychologistScope } from "@/lib/auth/require";

type Props = {
    searchParams: Promise<{
        search?: string;
        psychologistId?: string;
        joinedFrom?: string;
        joinedTo?: string;
    }>;
};

export default async function ClientesPage({ searchParams }: Props) {
    const actor = await requireActor();
    const params = await searchParams;

    const [patients, psychologists] = await Promise.all([
        getPatients({
            search: params.search,
            psychologistId: resolvePsychologistScope(
                actor,
                params.psychologistId,
            ),
            joinedFrom: params.joinedFrom
                ? new Date(`${params.joinedFrom}T00:00:00`)
                : undefined,
            joinedTo: params.joinedTo
                ? new Date(`${params.joinedTo}T23:59:59`)
                : undefined,
        }),
        getAllPsychologists(),
    ]);

    const psychologistOptions = psychologists.map(p => ({
        id: p.id,
        name: p.name,
    }));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clientes"
                description="Pacientes de la plataforma, con su especialista asignado por modalidad"
                actions={
                    can(actor.role, "intake.read.all") ? (
                        <a
                            href="/api/admin/formularios/export.csv"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                Exportar CSV
                            </Button>
                        </a>
                    ) : undefined
                }
            />

            <Suspense fallback={<Skeleton className="h-9 w-full sm:w-96" />}>
                <ClientFilters
                    psychologists={
                        can(actor.role, "intake.read.all")
                            ? psychologistOptions
                            : undefined
                    }
                />
            </Suspense>

            <PatientTable patients={patients} />
        </div>
    );
}
