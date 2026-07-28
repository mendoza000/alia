import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
    title: "Términos y Condiciones | ALIA",
};

export default function TerminosPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones">
            <p>
                Este contenido es un marcador de posición. El texto definitivo
                de los Términos y Condiciones de ALIA será proporcionado y
                publicado en esta página próximamente.
            </p>
        </LegalPageLayout>
    );
}
