import { headers } from "next/headers";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { PsychologistSectionClient } from "./index";

export async function PsychologistSection() {
    const country = (await headers()).get("x-vercel-ip-country");
    const [psychologists, rate] = await Promise.all([
        getActivePsychologists(),
        getPublicDisplayRate(country),
    ]);
    return (
        <PsychologistSectionClient
            psychologists={psychologists}
            globalRate={rate}
        />
    );
}
