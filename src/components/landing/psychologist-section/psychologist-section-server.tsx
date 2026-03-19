import { getActivePsychologists } from "@/lib/queries/psychologists";
import { PsychologistSectionClient } from "./index";

export async function PsychologistSection() {
    const psychologists = await getActivePsychologists();
    return <PsychologistSectionClient psychologists={psychologists} />;
}
