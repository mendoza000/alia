import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import type { PatientRow } from "@/lib/admin/patient-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableShell } from "@/components/admin/data-table-shell";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const TRACK_LABELS: Record<string, string> = {
    INDIVIDUAL: "Individual",
    COUPLE: "Pareja",
};

function TracksSummary({ tracks }: { tracks: PatientRow["tracks"] }) {
    const entries = Object.entries(tracks);
    if (entries.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }
    return (
        <div className="flex flex-wrap gap-1">
            {entries.map(([sessionType, psychologist]) => (
                <Badge
                    key={sessionType}
                    variant="secondary"
                    className="text-xs"
                >
                    {TRACK_LABELS[sessionType] ?? sessionType}:{" "}
                    {psychologist?.name}
                </Badge>
            ))}
        </div>
    );
}

export function PatientTable({ patients }: { patients: PatientRow[] }) {
    if (patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No se encontraron clientes
                </p>
            </div>
        );
    }

    return (
        <DataTableShell
            items={patients}
            getKey={p => p.id}
            mobileRender={p => (
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {p.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {p.email}
                            </p>
                        </div>
                        <Link href={`/admin/clientes/${p.id}`}>
                            <Button variant="outline" size="sm">
                                <Eye />
                                Ver
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-3">
                        <TracksSummary tracks={p.tracks} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <dt className="text-muted-foreground">
                                Fecha de ingreso
                            </dt>
                            <dd>
                                {format(p.createdAt, "d MMM yyyy", {
                                    locale: es,
                                })}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Citas</dt>
                            <dd>
                                {p.pastAppointmentCount} pasadas ·{" "}
                                {p.upcomingAppointmentCount} próximas
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        >
            <Table>
                <TableHeader className="[&_th]:font-semibold">
                    <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Especialista asignado</TableHead>
                        <TableHead>Fecha de ingreso</TableHead>
                        <TableHead>Citas</TableHead>
                        <TableHead>Formulario</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map(p => (
                        <TableRow key={p.id}>
                            <TableCell>
                                <p className="text-sm font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {p.email}
                                </p>
                            </TableCell>
                            <TableCell>
                                <TracksSummary tracks={p.tracks} />
                            </TableCell>
                            <TableCell className="text-sm">
                                {format(p.createdAt, "d MMM yyyy", {
                                    locale: es,
                                })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {p.pastAppointmentCount} pasadas ·{" "}
                                {p.upcomingAppointmentCount} próximas
                            </TableCell>
                            <TableCell>
                                {p.hasIntakeForm ? (
                                    <FileText className="size-4 text-muted-foreground" />
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        —
                                    </span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Link href={`/admin/clientes/${p.id}`}>
                                    <Button variant="ghost" size="icon-sm">
                                        <Eye className="size-4" />
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DataTableShell>
    );
}
