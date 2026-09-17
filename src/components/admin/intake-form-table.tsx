import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { FileTextIcon } from "lucide-react";
import Link from "next/link";
import { CARACAS_TZ } from "@/lib/availability";
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

type IntakeFormRow = {
    id: string;
    createdAt: Date;
    user: {
        name: string;
        email: string;
        appointments: {
            id: string;
            dateTime: Date;
            psychologist: { name: string };
        }[];
    };
};

function PdfIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 15V3m0 12-4-4m4 4 4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" />
        </svg>
    );
}

function FormActions({ appointmentId }: { appointmentId: string }) {
    return (
        <div className="flex items-center gap-1">
            <Link href={`/admin/formularios/${appointmentId}`}>
                <Button variant="ghost" size="icon-sm" title="Ver formulario">
                    <FileTextIcon className="size-4" />
                </Button>
            </Link>
            <a
                href={`/api/admin/formularios/${appointmentId}/pdf`}
                target="_blank"
                title="Exportar PDF"
                rel="noreferrer"
            >
                <Button variant="ghost" size="icon-sm">
                    <PdfIcon />
                </Button>
            </a>
        </div>
    );
}

export function IntakeFormTable({ forms }: { forms: IntakeFormRow[] }) {
    if (forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No hay formularios registrados
                </p>
            </div>
        );
    }

    return (
        <DataTableShell
            items={forms}
            getKey={f => f.id}
            mobileRender={f => {
                const appointment = f.user.appointments[0];
                return (
                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {f.user.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {f.user.email}
                                </p>
                            </div>
                            {appointment && (
                                <FormActions appointmentId={appointment.id} />
                            )}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <dt className="text-muted-foreground">
                                    Psicólogo
                                </dt>
                                <dd>{appointment?.psychologist.name ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Fecha de sesión
                                </dt>
                                <dd className="capitalize">
                                    {appointment
                                        ? format(
                                              new TZDate(
                                                  appointment.dateTime,
                                                  CARACAS_TZ,
                                              ),
                                              "d MMM yyyy, HH:mm",
                                              { locale: es },
                                          )
                                        : "—"}
                                </dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-muted-foreground">
                                    Formulario enviado
                                </dt>
                                <dd>
                                    {format(
                                        new TZDate(f.createdAt, CARACAS_TZ),
                                        "d MMM yyyy, HH:mm",
                                        { locale: es },
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                );
            }}
        >
            <Table>
                <TableHeader className="[&_th]:font-semibold">
                    <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Psicólogo</TableHead>
                        <TableHead>Fecha de sesión</TableHead>
                        <TableHead>Formulario enviado</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map(f => {
                        const appointment = f.user.appointments[0];
                        return (
                            <TableRow key={f.id}>
                                <TableCell>
                                    <p className="text-sm font-medium">
                                        {f.user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {f.user.email}
                                    </p>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {appointment?.psychologist.name ?? "—"}
                                </TableCell>
                                <TableCell className="text-sm capitalize">
                                    {appointment
                                        ? format(
                                              new TZDate(
                                                  appointment.dateTime,
                                                  CARACAS_TZ,
                                              ),
                                              "d MMM yyyy, HH:mm",
                                              { locale: es },
                                          )
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(
                                        new TZDate(f.createdAt, CARACAS_TZ),
                                        "d MMM yyyy, HH:mm",
                                        { locale: es },
                                    )}
                                </TableCell>
                                <TableCell>
                                    {appointment && (
                                        <FormActions
                                            appointmentId={appointment.id}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </DataTableShell>
    );
}
