import { headers } from "next/headers";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { shuffle } from "@/lib/shuffle";
import { PsychologistSectionClient } from "./index";

export async function PsychologistSection() {
    const country = (await headers()).get("x-vercel-ip-country");
    const [allPsychologists, rate] = await Promise.all([
        getActivePsychologists(),
        getPublicDisplayRate(country),
    ]);
    const psychologists = shuffle(allPsychologists);
    return (
        <PsychologistSectionClient
            psychologists={psychologists}
            globalRate={rate}
        />
    );
}
