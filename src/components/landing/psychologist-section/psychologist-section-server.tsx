import { headers } from "next/headers";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { PsychologistSectionClient } from "./index";

const MAX_FEATURED = 3;

function pickRandom<T>(items: T[], count: number): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

export async function PsychologistSection() {
    const country = (await headers()).get("x-vercel-ip-country");
    const [allPsychologists, rate] = await Promise.all([
        getActivePsychologists(),
        getPublicDisplayRate(country),
    ]);
    const psychologists = pickRandom(allPsychologists, MAX_FEATURED);
    return (
        <PsychologistSectionClient
            psychologists={psychologists}
            globalRate={rate}
        />
    );
}
