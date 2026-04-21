import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { FileTextIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function FormulariosPage() {
  const intakeForms = await prisma.intakeForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          psychologist: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Formularios</h1>
          <p className="text-sm text-muted-foreground">
            Formularios de inventario de vida de los pacientes
          </p>
        </div>
        <a href="/api/admin/formularios/export.csv" target="_blank">
          <Button variant="outline" size="sm">
            Exportar CSV
          </Button>
        </a>
      </div>

      {intakeForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-sm text-muted-foreground">No hay formularios registrados</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader className="[&_th]:font-semibold">
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Fecha de cita</TableHead>
                <TableHead>Formulario enviado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakeForms.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{f.user.name}</p>
                    <p className="text-xs text-muted-foreground">{f.user.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{f.appointment.psychologist.name}</TableCell>
                  <TableCell className="text-sm capitalize">
                    {format(new Date(f.appointment.dateTime), "d MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(f.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/formularios/${f.appointment.id}`}>
                        <Button variant="ghost" size="icon-sm" title="Ver formulario">
                          <FileTextIcon className="size-4" />
                        </Button>
                      </Link>
                      <a
                        href={`/api/admin/formularios/${f.appointment.id}/pdf`}
                        target="_blank"
                        title="Exportar PDF"
                      >
                        <Button variant="ghost" size="icon-sm">
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 15V3m0 12-4-4m4 4 4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" />
                          </svg>
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
