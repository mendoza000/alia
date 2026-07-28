import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
    title: "Política de Reembolso y Cancelación | ALIA",
};

export default function ReembolsoPage() {
    return (
        <LegalPageLayout title="Política de Reembolso y Cancelación">
            <p>
                Este contenido es un marcador de posición. El texto definitivo
                de la Política de Reembolso y Cancelación de ALIA será
                proporcionado y publicado en esta página próximamente.
            </p>
        </LegalPageLayout>
    );
}
