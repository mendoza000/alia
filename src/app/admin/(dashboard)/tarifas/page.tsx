import { getAllRates } from "@/lib/admin/payment-rate-queries";
import { RateTable } from "@/components/admin/rate-table";
import { RateSheet } from "@/components/admin/rate-sheet";
import { PageHeader } from "@/components/admin/page-header";

export default async function TarifasPage() {
    const rates = await getAllRates();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tarifas"
                description="Monto global a cobrar por moneda, igual para todos los psicólogos"
                actions={<RateSheet />}
            />

            <RateTable rates={rates} />
        </div>
    );
}
