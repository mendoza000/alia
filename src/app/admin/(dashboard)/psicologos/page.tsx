import { getAllPsychologists } from "@/lib/admin/psychologist-queries";
import { PsychologistTable } from "@/components/admin/psychologist-table";
import { PsychologistSheet } from "@/components/admin/psychologist-sheet";

export default async function PsychologistsPage() {
  const psychologists = await getAllPsychologists();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Psicólogos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el equipo de psicólogos de ALIA
          </p>
        </div>
        <PsychologistSheet />
      </div>
      <PsychologistTable psychologists={psychologists} />
    </div>
  );
}
