import type { Metadata } from "next";
import { headers } from "next/headers";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { shuffle } from "@/lib/shuffle";
import { PsychologistCard } from "@/components/landing/psychologist-section/psychologist-card";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Nuestros psicólogos",
    description:
        "Conoce a todos los profesionales verificados de ALIA y agenda tu sesión.",
};

export default async function PsicologosPage() {
    const country = (await headers()).get("x-vercel-ip-country");
    const [allPsychologists, rate] = await Promise.all([
        getActivePsychologists(),
        getPublicDisplayRate(country),
    ]);
    const psychologists = shuffle(allPsychologists);

    return (
        <section className="relative overflow-hidden bg-background px-6 py-20 md:px-12 md:py-28 lg:px-20 xl:px-28 xl:py-36">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    itemListElement: psychologists.map((p, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        url: `${siteConfig.url}/psicologos/${p.slug}`,
                        name: p.name,
                    })),
                }}
            />
            <div className="relative mx-auto max-w-6xl">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground xl:text-base">
                        Profesionales a tu alcance
                    </span>
                    <h1 className="mt-2 font-heading text-3xl font-bold md:text-4xl xl:text-5xl">
                        Nuestros psicólogos
                    </h1>
                    <p className="mt-4 text-muted-foreground xl:text-lg">
                        Cada profesional está comprometido con tu bienestar
                        emocional. Encuentra al indicado para ti.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {psychologists.map((psychologist, i) => (
                        <PsychologistCard
                            key={psychologist.id}
                            psychologist={psychologist}
                            globalRate={rate}
                            index={i}
                            inView={true}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
