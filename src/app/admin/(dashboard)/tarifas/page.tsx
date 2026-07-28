import { getAllRates } from "@/lib/admin/payment-rate-queries";
import { RateTable } from "@/components/admin/rate-table";
import { RateSheet } from "@/components/admin/rate-sheet";

export default async function TarifasPage() {
  const rates = await getAllRates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Tarifas</h1>
          <p className="text-sm text-muted-foreground">
            Monto global a cobrar por moneda, igual para todos los
            psicólogos
          </p>
        </div>
        <RateSheet />
      </div>

      <RateTable rates={rates} />
    </div>
  );
}
