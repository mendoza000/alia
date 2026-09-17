import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { PsychologistTable } from "@/components/admin/psychologist-table";
import { PsychologistSheet } from "@/components/admin/psychologist-sheet";
import { PageHeader } from "@/components/admin/page-header";

export default async function PsychologistsPage() {
    const psychologists = await getAllPsychologists();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Psicólogos"
                description="Gestiona el equipo de psicólogos de ALIA"
                actions={<PsychologistSheet />}
            />
            <PsychologistTable psychologists={psychologists} />
        </div>
    );
}
