"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PeriodFilter } from "@/components/admin/period-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobado" },
  { value: "REJECTED", label: "Rechazado" },
  { value: "VOIDED", label: "Anulado" },
];

type PaymentsFiltersProps = {
  psychologists: { id: string; name: string }[];
};

export function PaymentsFilters({ psychologists }: PaymentsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        items={STATUS_OPTIONS}
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateParam("status", v ?? "all")}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={[
          { value: "all", label: "Todos los psicólogos" },
          ...psychologists.map((p) => ({ value: p.id, label: p.name })),
        ]}
        value={searchParams.get("psychologistId") ?? "all"}
        onValueChange={(v) => updateParam("psychologistId", v ?? "all")}
      >
        <SelectTrigger className="h-9 w-52">
          <SelectValue placeholder="Psicólogo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los psicólogos</SelectItem>
          {psychologists.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <PeriodFilter />
    </div>
  );
}
