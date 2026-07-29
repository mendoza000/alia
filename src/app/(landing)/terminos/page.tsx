import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";

export const metadata: Metadata = {
    title: "Términos y Condiciones | ALIA",
};

export default function TerminosPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones">
            <h2>Naturaleza del servicio</h2>
            <p>
                ALIA es un servicio de acompañamiento y bienestar emocional.
                No constituye terapia psicológica clínica, diagnóstico
                médico ni tratamiento psiquiátrico. Las sesiones agendadas a
                través de la plataforma tienen como propósito brindar
                acompañamiento y apoyo emocional, y no reemplazan la
                atención de un profesional de la salud en casos que
                requieran diagnóstico o tratamiento médico.
            </p>
            <h2>Atención en situaciones de crisis</h2>
            <p>
                ALIA no atiende emergencias médicas ni psiquiátricas. Si tú o
                alguien cercano está en riesgo o atravesando una crisis,
                contacta de inmediato a los servicios de emergencia de tu
                país o a una línea de ayuda local. Puedes encontrar la línea
                de ayuda disponible en tu país en{" "}
                <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    findahelpline.com
                </a>
                .
            </p>
            <p>
                El texto completo y definitivo de los Términos y Condiciones
                de ALIA será proporcionado y publicado en esta página
                próximamente.
            </p>
        </LegalPageLayout>
    );
}
