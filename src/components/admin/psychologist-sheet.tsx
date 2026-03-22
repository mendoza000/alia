"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PsychologistForm } from "@/components/admin/psychologist-form";
import type { PsychologistFormData } from "@/lib/validators/psychologist";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

type PsychologistSheetProps = {
  psychologist?: {
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
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function PsychologistSheet({
  psychologist,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PsychologistSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const isEditing = !!psychologist;
  const formId = `psych-form-${psychologist?.id ?? "new"}`;

  const defaultValues: PsychologistFormData | undefined = psychologist
    ? {
        name: psychologist.name,
        email: psychologist.email,
        phone: psychologist.phone ?? "",
        specialty: psychologist.specialty,
        bio: psychologist.bio,
        sessionRate: psychologist.sessionRate,
        sessionDuration: psychologist.sessionDuration,
        calendarId: psychologist.calendarId ?? "",
        photoUrl: psychologist.photoUrl ?? "",
        isActive: psychologist.isActive,
      }
    : undefined;

  function handleSuccess() {
    setOpen(false);
    if (isEditing) {
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ??
        (!isEditing && (
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Agregar psicólogo
          </Button>
        ))}
      <SheetContent
        side="right"
        className="min-w-lg bg-card flex h-full flex-col"
      >
        <SheetHeader>
          <SheetTitle className="font-sans text-lg font-semibold">
            {isEditing ? "Editar psicólogo" : "Agregar psicólogo"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? `Modifica la información de ${psychologist.name}`
              : "Completa la información del nuevo psicólogo"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <PsychologistForm
            key={psychologist?.id ?? "new"}
            psychologistId={psychologist?.id}
            defaultValues={defaultValues}
            onSuccess={handleSuccess}
            renderActions={false}
            formId={formId}
          />
        </div>
        <SheetFooter className="border-t px-4 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Guardar cambios" : "Crear psicólogo"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
