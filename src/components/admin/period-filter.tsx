"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateFilterPeriod } from "@/lib/admin/date-range";

export const PERIOD_OPTIONS: { value: DateFilterPeriod; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "month", label: "Este mes" },
  { value: "3months", label: "Últimos 3 meses" },
  { value: "6months", label: "Últimos 6 meses" },
  { value: "year", label: "Este año" },
  { value: "all", label: "Todo" },
];

export function PeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = (searchParams.get("period") as DateFilterPeriod) ?? "today";

  function handlePeriodChange(period: string | null) {
    if (!period) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.delete("dateFrom");
    params.delete("dateTo");
    router.push(`?${params.toString()}`);
  }

  function handleDateChange(key: "dateFrom" | "dateTo", date: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set(key, date);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select items={PERIOD_OPTIONS} value={value} onValueChange={handlePeriodChange}>
        <SelectTrigger className="h-9 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="h-9 w-40"
        value={searchParams.get("dateFrom") ?? ""}
        onChange={(e) => handleDateChange("dateFrom", e.target.value)}
        placeholder="Desde"
      />
      <Input
        type="date"
        className="h-9 w-40"
        value={searchParams.get("dateTo") ?? ""}
        onChange={(e) => handleDateChange("dateTo", e.target.value)}
        placeholder="Hasta"
      />
    </div>
  );
}
