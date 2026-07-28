import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
    title: "Política de Privacidad | ALIA",
};

export default function PrivacidadPage() {
    return (
        <LegalPageLayout title="Política de Privacidad">
            <p>
                Este contenido es un marcador de posición. El texto definitivo
                de la Política de Privacidad de ALIA será proporcionado y
                publicado en esta página próximamente.
            </p>
        </LegalPageLayout>
    );
}
