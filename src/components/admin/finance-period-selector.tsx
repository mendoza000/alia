"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinancePeriod } from "@/lib/admin/finance-queries";

const PERIOD_OPTIONS: { value: FinancePeriod; label: string }[] = [
  { value: "month", label: "Este mes" },
  { value: "3months", label: "Últimos 3 meses" },
  { value: "6months", label: "Últimos 6 meses" },
  { value: "year", label: "Este año" },
];

export function FinancePeriodSelector({ value }: { value: FinancePeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(period: string | null) {
    if (!period) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-52">
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
  );
}
