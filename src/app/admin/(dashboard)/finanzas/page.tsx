import { Suspense } from "react";
import {
  getFinanceByPsychologist,
  getFinanceSummary,
  resolveFinanceRange,
  type FinancePeriod,
} from "@/lib/admin/finance-queries";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { FinanceFilters } from "@/components/admin/finance-filters";
import { PayoutSettingsSheet } from "@/components/admin/payout-settings-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyBreakdown, formatUSD } from "@/lib/currency";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const VALID_PERIODS: FinancePeriod[] = ["month", "3months", "6months", "year", "all"];

type Props = {
  searchParams: Promise<{ period?: string; dateFrom?: string; dateTo?: string }>;
};

export default async function FinanzasPage({ searchParams }: Props) {
  const params = await searchParams;
  const period: FinancePeriod =
    VALID_PERIODS.includes(params.period as FinancePeriod)
      ? (params.period as FinancePeriod)
      : "month";
  const range = resolveFinanceRange(period, params.dateFrom, params.dateTo);

  const [summary, psychologists, payoutSettings] = await Promise.all([
    getFinanceSummary(range),
    getFinanceByPsychologist(range),
    getPayoutSettings(),
  ]);

  const grandTotal = summary.totalRevenueUsd;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Ingresos y sesiones por psicólogo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PayoutSettingsSheet defaultValues={payoutSettings} />
          <Suspense fallback={<Skeleton className="h-9 w-96" />}>
            <FinanceFilters value={period} />
          </Suspense>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total recaudado</p>
          <p className="mt-1 text-2xl font-bold">{formatUSD.format(summary.totalRevenueUsd)}</p>
          {summary.totalRevenueByCurrency.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrencyBreakdown(summary.totalRevenueByCurrency)}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sesiones realizadas</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalSessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Neto para la empresa</p>
          <p className="mt-1 text-2xl font-bold">{formatUSD.format(summary.netRevenueUsd)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Recaudado menos comisiones pagadas a psicólogos
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Conversión aproximada a USD, tasa de referencia actualizada a diario. El desglose por moneda es el monto real cobrado.
      </p>

      {/* Per-psychologist breakdown */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">Por psicólogo</h2>
        {psychologists.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <p className="text-sm text-muted-foreground">
              No hay datos para el período seleccionado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {psychologists.map((p, i) => {
              const pct = grandTotal > 0 ? Math.round((p.totalRevenueUsd / grandTotal) * 100) : 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <span className="w-5 text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <Avatar>
                    {p.photoUrl && <AvatarImage src={p.photoUrl} />}
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatUSD.format(p.totalRevenueUsd)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sessionCount} {p.sessionCount === 1 ? "sesión" : "sesiones"} · {pct}%
                    </p>
                    {p.totalRevenueByCurrency.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrencyBreakdown(p.totalRevenueByCurrency)}
                      </p>
                    )}
                    <p className="mt-1 text-xs font-medium text-accent-foreground">
                      Debido: {formatUSD.format(p.totalOwedUsd)}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="hidden sm:block w-24">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
