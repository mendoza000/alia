"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteAppointment } from "@/lib/admin/appointment-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteAppointmentDialog({
  appointmentId,
  patientName,
  open,
  onOpenChange,
}: {
  appointmentId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteAppointment(appointmentId);
    if (result.success) {
      toast.success("Sesión eliminada");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar sesión</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar la sesión cancelada de{" "}
            <span className="font-medium text-foreground">{patientName}</span>
            ? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
