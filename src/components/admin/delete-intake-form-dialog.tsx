"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteIntakeForm } from "@/lib/admin/intake-form-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteIntakeFormDialog({
  appointmentId,
  patientName,
  children,
}: {
  appointmentId: string;
  patientName: string;
  children: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteIntakeForm(appointmentId);
      toast.success("Formulario eliminado");
      router.push("/admin/formularios");
    } catch {
      toast.error("Error al eliminar el formulario");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<span className="contents" />}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar formulario</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el formulario de{" "}
            <span className="font-medium text-foreground">{patientName}</span>
            ? La cita volverá al estado &quot;pendiente de formulario&quot; y
            esta acción no se puede deshacer.
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
