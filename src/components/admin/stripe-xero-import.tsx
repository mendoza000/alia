"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertStripeBalanceHistoryToXero } from "@/lib/admin/stripe-xero-actions";

function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function StripeXeroImport() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await convertStripeBalanceHistoryToXero(formData);

            downloadCsv(result.csv, result.filename);

            toast.success(`${result.rowCount} filas convertidas`);
            for (const warning of result.warnings) {
                toast.warning(warning);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error al convertir el archivo",
            );
        } finally {
            setIsLoading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div>
                <p className="font-heading text-sm font-semibold">
                    Importar a Xero
                </p>
                <p className="text-xs text-muted-foreground">
                    Sube el CSV de "Balance History" de Stripe y descarga el
                    archivo listo para importar en Xero.
                </p>
            </div>
            <Button
                variant="outline"
                className="gap-2"
                isLoading={isLoading}
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="size-4" />
                Subir CSV de Stripe
            </Button>
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
