"use server";

import Papa from "papaparse";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { requirePermission } from "@/lib/auth/require";

// The entity that files with Xero operates on US Mountain Time (MST -07:00
// in winter, MDT -06:00 in summer) — distinct from the Caracas timezone used
// elsewhere for appointment/admin operations (see src/lib/availability.ts).
// Stripe's balance history export is UTC; converting to the wrong zone
// silently shifts late-UTC transactions onto the wrong calendar day for
// accounting purposes.
const BUSINESS_TZ = "America/Denver";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const REQUIRED_COLUMNS = [
    "id",
    "Type",
    "Source",
    "Amount",
    "Fee",
    "Net",
    "Currency",
    "Created (UTC)",
    "Available On (UTC)",
] as const;

// Xero's CSV bank statement import only has one Amount column (positive =
// money in, negative = money out) — Fee is broken out into its own line
// below the main transaction rather than netted into Amount, so it stays
// visible as its own expense in the ledger.
const TYPE_DESCRIPTIONS: Record<string, string> = {
    payout: "STRIPE PAYOUT",
    payout_minimum_balance_hold: "Minimum balance held from a payout",
    payout_minimum_balance_release: "Minimum balance released after a payout",
    charge: "Service revenue",
    payment: "Service revenue",
};

type StripeBalanceRow = Record<(typeof REQUIRED_COLUMNS)[number], string>;

type XeroRow = {
    Date: string;
    Amount: string;
    Description: string;
    Reference: string;
};

export type ConvertResult = {
    csv: string;
    filename: string;
    rowCount: number;
    warnings: string[];
};

function toBusinessDate(createdUtc: string): string {
    // Stripe formats "Created (UTC)" as "YYYY-MM-DD HH:mm" with no offset —
    // treat it as an explicit UTC instant before converting.
    const instant = new Date(`${createdUtc.replace(" ", "T")}Z`);
    return format(new TZDate(instant, BUSINESS_TZ), "yyyy-MM-dd");
}

function parseAmount(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export async function convertStripeBalanceHistoryToXero(
    formData: FormData,
): Promise<ConvertResult> {
    await requirePermission("finance.read");

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No se proporcionó un archivo");
    if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("El archivo debe ser un CSV");
    }
    if (file.size > MAX_SIZE) {
        throw new Error("El archivo no debe superar los 10 MB");
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
        throw new Error(`No se pudo leer el CSV: ${parsed.errors[0].message}`);
    }

    const headers = parsed.meta.fields ?? [];
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missing.length > 0) {
        throw new Error(
            `El CSV no tiene el formato esperado del "Balance History" de Stripe. Faltan las columnas: ${missing.join(", ")}`,
        );
    }

    const warnings: string[] = [];
    const outputRows: XeroRow[] = [];

    for (const raw of parsed.data as StripeBalanceRow[]) {
        const reference = raw.Source?.trim() || raw.id?.trim() || "";
        const date = toBusinessDate(raw["Created (UTC)"]);
        const type = raw.Type?.trim() ?? "";

        let description = TYPE_DESCRIPTIONS[type];
        if (description === undefined) {
            description = type;
            warnings.push(
                `Tipo de transacción no reconocido "${type}" (${reference}) — se dejó el valor tal cual.`,
            );
        }

        outputRows.push({
            Date: date,
            Amount: raw.Amount,
            Description: description,
            Reference: reference,
        });

        const fee = parseAmount(raw.Fee);
        if (fee !== 0) {
            outputRows.push({
                Date: date,
                Amount: (-fee).toFixed(2),
                Description: "Stripe fee",
                // The fee isn't its own object in Stripe — it's the "id" of
                // this same balance transaction line, distinct from the main
                // row's Source (the ch_/po_ charge/payout object). Reusing
                // Source here would give both rows an identical Reference.
                Reference: raw.id?.trim() ?? "",
            });
        }
    }

    const csv = Papa.unparse({
        fields: ["Date", "Amount", "Description", "Reference"],
        data: outputRows,
    });

    return {
        csv,
        filename: `xero-import-${format(new Date(), "yyyy-MM-dd")}.csv`,
        rowCount: outputRows.length,
        warnings,
    };
}
