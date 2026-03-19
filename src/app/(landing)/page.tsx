import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PsychologistSection } from "@/components/landing/psychologist-section/psychologist-section-server";

export default async function HomePage() {
    return (
        <>
            <HeroSection />
            <HowItWorksSection />
            <PsychologistSection />
            <FAQSection />
        </>
    );
}
