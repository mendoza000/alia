"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit2, MoreHorizontal, Power } from "lucide-react";
import { toast } from "sonner";
import { toggleCoupon } from "@/lib/admin/coupon-actions";
import type { CouponRow } from "@/lib/admin/coupon-queries";
import { Badge } from "@/components/ui/badge";
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
import { CouponSheet } from "@/components/admin/coupon-sheet";

const formatCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function CouponTable({ coupons }: { coupons: CouponRow[] }) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editCoupon, setEditCoupon] = useState<CouponRow | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(id: string) {
    setTogglingId(id);
    startTransition(async () => {
      const result = await toggleCoupon(id);
      if (result.success) {
        const c = coupons.find((c) => c.id === id);
        toast.success(c?.isActive ? "Cupón desactivado" : "Cupón activado");
      } else {
        toast.error(result.error);
      }
      setTogglingId(null);
    });
  }

  if (coupons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <p className="text-sm text-muted-foreground">No hay cupones registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="[&_th]:font-semibold">
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Total descontado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => {
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const maxedOut = c.maxUses !== null && c.currentUses >= c.maxUses;

              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold tracking-wide text-sm">
                    {c.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.discountPercent}%</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.expiresAt ? (
                      <span className={expired ? "text-destructive" : ""}>
                        {format(new Date(c.expiresAt), "d MMM yyyy", { locale: es })}
                      </span>
                    ) : (
                      "Sin vencimiento"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className={maxedOut ? "text-destructive" : ""}>
                      {c.currentUses}
                      {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.totalDiscounted > 0
                      ? formatCOP.format(c.totalDiscounted)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.isActive && !expired && !maxedOut ? "default" : "outline"}
                      className={
                        c.isActive && !expired && !maxedOut
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {!c.isActive
                        ? "Inactivo"
                        : expired
                          ? "Vencido"
                          : maxedOut
                            ? "Agotado"
                            : "Activo"}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => setEditCoupon(c)}>
                          <Edit2 />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle(c.id)}
                          disabled={togglingId === c.id}
                        >
                          <Power />
                          {c.isActive ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editCoupon && (
        <CouponSheet
          coupon={editCoupon}
          open={!!editCoupon}
          onOpenChange={(v) => !v && setEditCoupon(null)}
        />
      )}
    </>
  );
}
