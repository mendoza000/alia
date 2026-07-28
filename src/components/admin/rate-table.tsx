"use client";

import { useState, useTransition } from "react";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRate } from "@/lib/admin/payment-rate-actions";
import type { PaymentRateRow } from "@/lib/admin/payment-rate-queries";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { RateSheet } from "@/components/admin/rate-sheet";

export function RateTable({ rates }: { rates: PaymentRateRow[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<PaymentRateRow | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteRate(id);
      if (result.success) {
        toast.success("Tarifa eliminada");
      } else {
        toast.error(result.error);
      }
      setDeletingId(null);
    });
  }

  if (rates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">
          No hay tarifas configuradas
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="[&_th]:font-semibold">
            <TableRow>
              <TableHead>Moneda</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-semibold tracking-wide text-sm">
                  {r.currency}
                </TableCell>
                <TableCell className="text-sm">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: r.currency,
                    maximumFractionDigits: 0,
                  }).format(r.amount)}
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
                      <DropdownMenuItem onClick={() => setEditRate(r)}>
                        <Edit2 />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        <Trash2 />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editRate && (
        <RateSheet
          rate={editRate}
          open={!!editRate}
          onOpenChange={(v) => !v && setEditRate(null)}
        />
      )}
    </>
  );
}
