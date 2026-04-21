import { Suspense } from "react";
import {
  getFinanceByPsychologist,
  getFinanceSummary,
  type FinancePeriod,
} from "@/lib/admin/finance-queries";
import { FinancePeriodSelector } from "@/components/admin/finance-period-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const formatCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const VALID_PERIODS: FinancePeriod[] = ["month", "3months", "6months", "year"];

type Props = {
  searchParams: Promise<{ period?: string }>;
};

export default async function FinanzasPage({ searchParams }: Props) {
  const params = await searchParams;
  const period: FinancePeriod =
    VALID_PERIODS.includes(params.period as FinancePeriod)
      ? (params.period as FinancePeriod)
      : "month";

  const [summary, psychologists] = await Promise.all([
    getFinanceSummary(period),
    getFinanceByPsychologist(period),
  ]);

  const grandTotal = summary.totalRevenue;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Ingresos y sesiones por psicólogo
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-9 w-52" />}>
          <FinancePeriodSelector value={period} />
        </Suspense>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total recaudado</p>
          <p className="mt-1 text-2xl font-bold">{formatCOP.format(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sesiones realizadas</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalSessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Promedio por sesión</p>
          <p className="mt-1 text-2xl font-bold">{formatCOP.format(summary.avgSession)}</p>
        </div>
      </div>

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
              const pct = grandTotal > 0 ? Math.round((p.totalRevenue / grandTotal) * 100) : 0;
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
                    <p className="font-semibold">{formatCOP.format(p.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sessionCount} {p.sessionCount === 1 ? "sesión" : "sesiones"} · {pct}%
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
