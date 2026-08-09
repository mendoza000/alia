import type { Metadata } from "next";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PsychologistSection } from "@/components/landing/psychologist-section/psychologist-section-server";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Agenda tu sesión con un psicólogo",
    description:
        "Encuentra psicólogos profesionales. Agenda tu sesión en línea y completa tu formulario de admisión.",
    openGraph: {
        title: "ALIA — Tu psicólogo Aliado",
        description:
            "Encuentra psicólogos profesionales. Agenda tu sesión en línea.",
    },
};

export default async function HomePage() {
    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "ProfessionalService",
                    name: siteConfig.name,
                    description: siteConfig.description,
                    url: siteConfig.url,
                    priceRange: "$$",
                }}
            />
            <HeroSection />
            <HowItWorksSection />
            <PsychologistSection />
            <FAQSection />
        </>
    );
}
