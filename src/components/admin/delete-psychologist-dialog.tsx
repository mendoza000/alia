"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deletePsychologist } from "@/lib/admin/psychologist-actions";
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

export function DeletePsychologistDialog({
  psychologistId,
  psychologistName,
  children,
}: {
  psychologistId: string;
  psychologistName: string;
  children: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deletePsychologist(psychologistId);
      toast.success("Psicólogo eliminado");
      router.push("/admin/psicologos");
    } catch {
      toast.error("Error al eliminar el psicólogo");
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
          <DialogTitle>Eliminar psicólogo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-medium text-foreground">
              {psychologistName}
            </span>
            ? Esta acción eliminará también sus horarios y no se puede deshacer.
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
