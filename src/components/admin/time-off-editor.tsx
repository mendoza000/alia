"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createTimeOff, deleteTimeOff } from "@/lib/admin/time-off-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TimeOffRow = {
    id: string;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
};

export function TimeOffEditor({
    psychologistId,
    initialTimeOffs,
}: {
    psychologistId: string;
    initialTimeOffs: TimeOffRow[];
}) {
    const router = useRouter();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function handleAdd() {
        if (!startDate || !endDate) {
            toast.error("Selecciona fecha de inicio y fin");
            return;
        }
        const startsAt = new Date(`${startDate}T00:00:00`);
        const endsAt = new Date(`${endDate}T23:59:59`);
        startTransition(async () => {
            try {
                await createTimeOff(psychologistId, {
                    startsAt,
                    endsAt,
                    reason: reason || undefined,
                });
                toast.success("Día libre registrado");
                setStartDate("");
                setEndDate("");
                setReason("");
                router.refresh();
            } catch (e) {
                toast.error(
                    e instanceof Error ? e.message : "Error al guardar",
                );
            }
        });
    }

    function handleDelete(id: string) {
        setDeletingId(id);
        startTransition(async () => {
            try {
                await deleteTimeOff(id);
                toast.success("Día libre eliminado");
                router.refresh();
            } catch {
                toast.error("Error al eliminar");
            } finally {
                setDeletingId(null);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="time-off-start">Desde</Label>
                    <Input
                        id="time-off-start"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="time-off-end">Hasta</Label>
                    <Input
                        id="time-off-end"
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="time-off-reason">Motivo (opcional)</Label>
                    <Input
                        id="time-off-reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Vacaciones, cita médica..."
                    />
                </div>
            </div>
            <Button onClick={handleAdd} isLoading={isPending && !deletingId}>
                Agregar día libre
            </Button>

            {initialTimeOffs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No tienes días libres registrados.
                </p>
            ) : (
                <div className="space-y-2">
                    {initialTimeOffs.map(t => (
                        <div
                            key={t.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                        >
                            <div className="text-sm">
                                <p className="font-medium">
                                    {format(t.startsAt, "d MMM yyyy", {
                                        locale: es,
                                    })}{" "}
                                    —{" "}
                                    {format(t.endsAt, "d MMM yyyy", {
                                        locale: es,
                                    })}
                                </p>
                                {t.reason && (
                                    <p className="text-xs text-muted-foreground">
                                        {t.reason}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(t.id)}
                                disabled={deletingId === t.id}
                            >
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
