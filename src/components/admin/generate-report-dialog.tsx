"use client";

import { useState, useTransition } from "react";
import { FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { emailSessionsReport } from "@/lib/admin/report-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_PSYCHOLOGISTS = "all";

export function GenerateReportDialog({
  psychologists,
}: {
  psychologists: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [psychologistId, setPsychologistId] = useState(ALL_PSYCHOLOGISTS);
  const [isSending, startSending] = useTransition();

  const canGenerate = Boolean(dateFrom && dateTo && dateFrom <= dateTo);

  const params = new URLSearchParams({ dateFrom, dateTo });
  if (psychologistId !== ALL_PSYCHOLOGISTS) {
    params.set("psychologistId", psychologistId);
  }
  const href = `/api/admin/citas/reporte?${params.toString()}`;

  function handleSendEmail() {
    startSending(async () => {
      const result = await emailSessionsReport({
        dateFrom,
        dateTo,
        psychologistId:
          psychologistId === ALL_PSYCHOLOGISTS ? undefined : psychologistId,
      });
      if (result.success) {
        toast.success(
          result.sentCount === 1
            ? "Reporte enviado al psicólogo"
            : `Reporte enviado a ${result.sentCount} psicólogos`,
        );
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileText />
        Generar reporte
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            Reporte de sesiones y pagos
          </DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas y, si lo deseas, un psicólogo
            específico. El PDF lista las sesiones confirmadas y completadas
            del rango, marcando cuáles están pagadas y cuáles pendientes. Al
            enviarlo por correo, cada psicólogo recibe únicamente sus propias
            sesiones.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Psicólogo</Label>
          <Select
            items={[
              { value: ALL_PSYCHOLOGISTS, label: "Todos los psicólogos" },
              ...psychologists.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={psychologistId}
            onValueChange={(v) => setPsychologistId(v ?? ALL_PSYCHOLOGISTS)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Psicólogo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PSYCHOLOGISTS}>
                Todos los psicólogos
              </SelectItem>
              {psychologists.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={!canGenerate}
            onClick={() => {
              window.open(href, "_blank", "noopener,noreferrer");
              setOpen(false);
            }}
          >
            <FileText />
            Descargar PDF
          </Button>
          <Button
            disabled={!canGenerate}
            isLoading={isSending}
            onClick={handleSendEmail}
          >
            <Mail />
            Enviar por correo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
