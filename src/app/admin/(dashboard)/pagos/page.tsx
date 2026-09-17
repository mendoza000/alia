import { Suspense } from "react";
import type { PaymentStatus } from "@/generated/prisma/enums";
import {
    getAllPayments,
    type PaymentFilters,
} from "@/lib/admin/payment-queries";
import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { getPayoutSettings } from "@/lib/admin/payout-settings-queries";
import { PaymentTable } from "@/components/admin/payment-table";
import { PaymentsFilters } from "@/components/admin/payments-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyBreakdown, formatUSD } from "@/lib/currency";
import { getUsdRateMap } from "@/lib/exchange-rates";
import {
    getPaymentAmountUsd,
    getPsychologistShareUsd,
    paymentToUsd,
    sumUsd,
} from "@/lib/payment-math";
import {
    resolveDateRange,
    type DateFilterPeriod,
} from "@/lib/admin/date-range";
import { can } from "@/lib/auth/permissions";
import { requireActor, resolvePsychologistScope } from "@/lib/auth/require";

const VALID_PERIODS: DateFilterPeriod[] = [
    "today",
    "month",
    "3months",
    "6months",
    "year",
    "all",
];

type Props = {
    searchParams: Promise<{
        status?: string;
        psychologistId?: string;
        period?: string;
        dateFrom?: string;
        dateTo?: string;
    }>;
};

export default async function PagosPage({ searchParams }: Props) {
    const actor = await requireActor();
    const params = await searchParams;

    const period: DateFilterPeriod = VALID_PERIODS.includes(
        params.period as DateFilterPeriod,
    )
        ? (params.period as DateFilterPeriod)
        : "today";
    const range = resolveDateRange(period, params.dateFrom, params.dateTo);

    const filters: PaymentFilters = {
        status: params.status as PaymentStatus | undefined,
        psychologistId: resolvePsychologistScope(actor, params.psychologistId),
        range,
    };

    const [payments, psychologists, rates, commissionRates] = await Promise.all(
        [
            getAllPayments(filters),
            getAllPsychologists(),
            getUsdRateMap(),
            getPayoutSettings(),
        ],
    );

    const paymentsWithUsd = payments.map(p => ({
        ...p,
        finalAmountUsd: getPaymentAmountUsd(p, rates),
    }));

    // Same set the table renders, narrowed to what actually counts as
    // collected revenue — so summing the visible "Total (USD)" column always
    // reconciles with these totals.
    const approved = paymentsWithUsd.filter(
        p =>
            p.status === "APPROVED" &&
            ["CONFIRMED", "COMPLETED"].includes(p.appointment.status),
    );

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
    const totalRevenueUsd = sumUsd(approved.map(p => p.finalAmountUsd));
    const totalDiscountsUsd = sumUsd(
        approved.map(p =>
            paymentToUsd(
                p.discountAmount,
                p.currency,
                p.exchangeRateToUsd,
                rates,
            ),
        ),
    );
    const totalOwedUsd = sumUsd(
        approved.map(p => getPsychologistShareUsd(p, p.finalAmountUsd)),
    );

    const psychologistOptions = psychologists.map(p => ({
        id: p.id,
        name: p.name,
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total recaudado
                    </p>
                    <p className="mt-1 text-xl font-bold">
                        {formatUSD.format(totalRevenueUsd)}
                    </p>
                    {revenueByCurrency.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {formatCurrencyBreakdown(revenueByCurrency)}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {approved.length} pagos aprobados
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total descontado
                    </p>
                    <p className="mt-1 text-xl font-bold">
                        {formatUSD.format(totalDiscountsUsd)}
                    </p>
                    {discountsByCurrency.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {formatCurrencyBreakdown(discountsByCurrency)}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Con cupones aplicados
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Debido a psicólogos
                    </p>
                    <p className="mt-1 text-xl font-bold">
                        {formatUSD.format(totalOwedUsd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Según la comisión elegida por pago
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total transacciones
                    </p>
                    <p className="mt-1 text-xl font-bold">{payments.length}</p>
                    <p className="text-xs text-muted-foreground">
                        Todos los estados
                    </p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Monto en USD según lo liquidado por Stripe cuando está
                disponible; si no, se estima con la tasa del día en que se
                aprobó el pago. El desglose por moneda es el monto real cobrado.
            </p>

            <Suspense fallback={<Skeleton className="h-9 w-full sm:w-96" />}>
                <PaymentsFilters
                    psychologists={
                        can(actor.role, "appointment.read.all")
                            ? psychologistOptions
                            : undefined
                    }
                />
            </Suspense>

            <PaymentTable
                payments={paymentsWithUsd}
                commissionRates={commissionRates}
            />
        </div>
    );
}
