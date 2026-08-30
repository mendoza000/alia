"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateAppointmentNotes } from "@/lib/admin/appointment-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export function AppointmentNotesDialog({
  appointmentId,
  patientName,
  initialNotes,
  open,
  onOpenChange,
}: {
  appointmentId: string;
  patientName: string;
  initialNotes: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateAppointmentNotes(appointmentId, notes);
    if (result.success) {
      toast.success("Nota guardada");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setIsSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setNotes(initialNotes ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nota interna</DialogTitle>
          <DialogDescription>
            Solo visible para el equipo admin — {patientName} y el psicólogo no la ven.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe una nota interna sobre esta sesión..."
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={handleSave} isLoading={isSaving}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
