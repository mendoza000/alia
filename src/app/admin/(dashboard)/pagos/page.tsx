import { Suspense } from "react";
import type { PaymentStatus } from "@/generated/prisma/enums";
import { getAllPayments, type PaymentFilters } from "@/lib/admin/payment-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { PaymentTable } from "@/components/admin/payment-table";
import { PaymentsFilters } from "@/components/admin/payments-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyBreakdown, formatUSD } from "@/lib/currency";
import { getUsdRateMap, paymentToUsd } from "@/lib/exchange-rates";

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

  const [payments, psychologists, rates, commissionRates] = await Promise.all([
    getAllPayments(filters),
    getAllPsychologists(),
    getUsdRateMap(),
    getPayoutSettings(),
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

  const revenueByCurrency = currencyTotals.map(([currency, t]) => ({
    currency,
    amount: t.revenue,
  }));
  const discountsByCurrency = currencyTotals.map(([currency, t]) => ({
    currency,
    amount: t.discounts,
  }));
  const totalRevenueUsd = approved.reduce(
    (sum, p) => sum + paymentToUsd(p.finalAmount, p.currency, p.exchangeRateToUsd, rates),
    0,
  );
  const totalDiscountsUsd = approved.reduce(
    (sum, p) => sum + paymentToUsd(p.discountAmount, p.currency, p.exchangeRateToUsd, rates),
    0,
  );
  const totalOwedUsd = approved.reduce(
    (sum, p) => sum + (p.payoutAmountUsd ?? 0),
    0,
  );

  const psychologistOptions = psychologists.map((p) => ({ id: p.id, name: p.name }));

  const paymentsWithUsd = payments.map((p) => ({
    ...p,
    finalAmountUsd: paymentToUsd(p.finalAmount, p.currency, p.exchangeRateToUsd, rates),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Historial de transacciones de la plataforma
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total recaudado</p>
          <p className="mt-1 text-xl font-bold">{formatUSD.format(totalRevenueUsd)}</p>
          {revenueByCurrency.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrencyBreakdown(revenueByCurrency)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{approved.length} pagos aprobados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total descontado</p>
          <p className="mt-1 text-xl font-bold">{formatUSD.format(totalDiscountsUsd)}</p>
          {discountsByCurrency.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrencyBreakdown(discountsByCurrency)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Con cupones aplicados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Debido a psicólogos</p>
          <p className="mt-1 text-xl font-bold">{formatUSD.format(totalOwedUsd)}</p>
          <p className="text-xs text-muted-foreground">Según la comisión elegida por pago</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total transacciones</p>
          <p className="mt-1 text-xl font-bold">{payments.length}</p>
          <p className="text-xs text-muted-foreground">Todos los estados</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Conversión a USD con la tasa de referencia del día en que se aprobó cada pago. El desglose por moneda es el monto real cobrado.
      </p>

      <Suspense fallback={<Skeleton className="h-9 w-96" />}>
        <PaymentsFilters psychologists={psychologistOptions} />
      </Suspense>

      <PaymentTable payments={paymentsWithUsd} commissionRates={commissionRates} />
    </div>
  );
}
