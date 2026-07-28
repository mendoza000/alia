import { Suspense } from "react";
import type { PaymentStatus } from "@/generated/prisma/enums";
import { getAllPayments, type PaymentFilters } from "@/lib/admin/payment-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { PaymentTable } from "@/components/admin/payment-table";
import { PaymentsFilters } from "@/components/admin/payments-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyAmount } from "@/lib/currency";

type Props = {
  searchParams: Promise<{
    status?: string;
    psychologistId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function PagosPage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: PaymentFilters = {
    status: params.status as PaymentStatus | undefined,
    psychologistId: params.psychologistId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const [payments, psychologists] = await Promise.all([
    getAllPayments(filters),
    getAllPsychologists(),
  ]);

  const approved = payments.filter((p) => p.status === "APPROVED");

  const totalsByCurrency = approved.reduce<
    Record<string, { revenue: number; discounts: number }>
  >((acc, p) => {
    const entry = acc[p.currency] ?? { revenue: 0, discounts: 0 };
    entry.revenue += p.finalAmount;
    entry.discounts += p.discountAmount;
    acc[p.currency] = entry;
    return acc;
  }, {});
  const currencyTotals = Object.entries(totalsByCurrency);

  const psychologistOptions = psychologists.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Historial de transacciones de la plataforma
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total recaudado</p>
          {currencyTotals.length === 0 ? (
            <p className="mt-1 text-xl font-bold">—</p>
          ) : (
            currencyTotals.map(([currency, t]) => (
              <p key={currency} className="mt-1 text-xl font-bold">
                {formatCurrencyAmount(t.revenue, currency)}
              </p>
            ))
          )}
          <p className="text-xs text-muted-foreground">{approved.length} pagos aprobados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total descontado</p>
          {currencyTotals.length === 0 ? (
            <p className="mt-1 text-xl font-bold">—</p>
          ) : (
            currencyTotals.map(([currency, t]) => (
              <p key={currency} className="mt-1 text-xl font-bold">
                {formatCurrencyAmount(t.discounts, currency)}
              </p>
            ))
          )}
          <p className="text-xs text-muted-foreground">Con cupones aplicados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total transacciones</p>
          <p className="mt-1 text-xl font-bold">{payments.length}</p>
          <p className="text-xs text-muted-foreground">Todos los estados</p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-9 w-96" />}>
        <PaymentsFilters psychologists={psychologistOptions} />
      </Suspense>

      <PaymentTable payments={payments} />
    </div>
  );
}
