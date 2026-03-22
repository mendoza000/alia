"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { togglePsychologistActive } from "@/lib/admin/psychologist-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PsychologistSheet } from "@/components/admin/psychologist-sheet";
import { DeletePsychologistDialog } from "@/components/admin/delete-psychologist-dialog";

type PsychologistData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  bio: string;
  sessionRate: number;
  sessionDuration: number;
  calendarId: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PsychologistDetailHeader({
  psychologist,
}: {
  psychologist: PsychologistData;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    setIsToggling(true);
    try {
      await togglePsychologistActive(psychologist.id);
      toast.success(
        psychologist.isActive
          ? "Psicólogo desactivado"
          : "Psicólogo activado",
      );
    } catch {
      toast.error("Error al cambiar el estado");
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {psychologist.photoUrl ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border">
            <Image
              src={psychologist.photoUrl}
              alt={psychologist.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <Avatar className="size-20">
            <AvatarFallback className="text-xl">
              {getInitials(psychologist.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            {psychologist.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{psychologist.specialty}</Badge>
            <Badge
              variant={psychologist.isActive ? "default" : "outline"}
              className={
                psychologist.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : ""
              }
            >
              {psychologist.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PsychologistSheet
          psychologist={psychologist}
          open={editOpen}
          onOpenChange={setEditOpen}
          trigger={
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          }
        />
        <Button
          variant="outline"
          onClick={handleToggle}
          disabled={isToggling}
        >
          <Power className="size-4" />
          {psychologist.isActive ? "Desactivar" : "Activar"}
        </Button>
        <DeletePsychologistDialog
          psychologistId={psychologist.id}
          psychologistName={psychologist.name}
        >
          <Button variant="outline" className="text-destructive">
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </DeletePsychologistDialog>
      </div>
    </div>
  );
}
