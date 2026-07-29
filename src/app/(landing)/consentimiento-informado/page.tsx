import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
    title: "Consentimiento Informado | ALIA",
};

export default function ConsentimientoInformadoPage() {
    return (
        <LegalPageLayout title="Consentimiento Informado">
            <p>
                Este contenido es un marcador de posición. El texto
                definitivo del Consentimiento Informado del servicio de
                acompañamiento de ALIA será proporcionado y publicado en esta
                página próximamente.
            </p>
        </LegalPageLayout>
    );
}
