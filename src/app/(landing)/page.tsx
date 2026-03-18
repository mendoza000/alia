import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <HowItWorksSection />
            <FAQSection />
        </>
    );
}
