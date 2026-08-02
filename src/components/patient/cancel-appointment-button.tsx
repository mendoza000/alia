"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelMyAppointment } from "@/lib/patient/appointment-actions";
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

export function CancelAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setIsCancelling(true);
    const result = await cancelMyAppointment(appointmentId);
    if (!result.success) {
      toast.error(result.error);
      setIsCancelling(false);
      return;
    }
    toast.success("Tu sesión fue cancelada");
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        Cancelar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar sesión</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar esta sesión? Se liberará el
            horario y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Volver
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleCancel}
            isLoading={isCancelling}
          >
            Sí, cancelar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
