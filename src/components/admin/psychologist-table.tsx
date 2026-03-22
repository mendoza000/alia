"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { togglePsychologistActive } from "@/lib/admin/psychologist-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeletePsychologistDialog } from "@/components/admin/delete-psychologist-dialog";

type Psychologist = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  specialty: string;
  sessionRate: number;
  isActive: boolean;
  _count: {
    appointments: number;
    schedules: number;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PsychologistTable({
  psychologists,
}: {
  psychologists: Psychologist[];
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      const p = psychologists.find((p) => p.id === id);
      await togglePsychologistActive(id);
      toast.success(
        p?.isActive ? "Psicólogo desactivado" : "Psicólogo activado",
      );
    } catch {
      toast.error("Error al cambiar el estado");
    } finally {
      setTogglingId(null);
    }
  }

  if (psychologists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">
          No hay psicólogos registrados
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="[&_th]:font-semibold">
          <TableRow>
            <TableHead>Psicólogo</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead>Tarifa</TableHead>
            <TableHead>Citas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {psychologists.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link
                  href={`/admin/psicologos/${p.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <Avatar>
                    {p.photoUrl && <AvatarImage src={p.photoUrl} />}
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{p.specialty}</Badge>
              </TableCell>
              <TableCell>{formatCOP(p.sessionRate)}</TableCell>
              <TableCell className="text-muted-foreground">
                {p._count.appointments}
              </TableCell>
              <TableCell>
                <Badge
                  variant={p.isActive ? "default" : "outline"}
                  className={
                    p.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : ""
                  }
                >
                  {p.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      render={
                        <Link href={`/admin/psicologos/${p.id}`} />
                      }
                    >
                      <Eye />
                      Ver perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggle(p.id)}
                      disabled={togglingId === p.id}
                    >
                      <Power />
                      {p.isActive ? "Desactivar" : "Activar"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeletePsychologistDialog
                      psychologistId={p.id}
                      psychologistName={p.name}
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 />
                        Eliminar
                      </DropdownMenuItem>
                    </DeletePsychologistDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
