import type { Metadata } from "next";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PsychologistSection } from "@/components/landing/psychologist-section/psychologist-section-server";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Agenda tu cita con un psicólogo — ALIA",
    description:
        "Encuentra psicólogos profesionales en Colombia. Agenda tu cita en línea, completa tu formulario y paga de forma segura.",
    openGraph: {
        title: "ALIA — Tu psicólogo Aliado",
        description:
            "Encuentra psicólogos profesionales en Colombia. Agenda tu cita en línea.",
    },
};

export default async function HomePage() {
    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "MedicalBusiness",
                    name: siteConfig.name,
                    description: siteConfig.description,
                    url: siteConfig.url,
                    address: {
                        "@type": "PostalAddress",
                        addressCountry: "CO",
                    },
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
