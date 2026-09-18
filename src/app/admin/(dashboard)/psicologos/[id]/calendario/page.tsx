import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { TZDate } from "@date-fns/tz";
import { getPsychologistById } from "@/lib/admin/psychologist-queries";
import { CARACAS_TZ } from "@/lib/availability";
import { getPsychologistCalendarRange } from "@/lib/admin/psychologist-calendar-queries";
import { PsychologistDayCalendar } from "@/components/admin/psychologist-day-calendar";
import { PageHeader } from "@/components/admin/page-header";

export default async function PsychologistCalendarPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const psychologist = await getPsychologistById(id);

    if (!psychologist) {
        notFound();
    }

    const now = new TZDate(new Date(), CARACAS_TZ);
    const initialRangeStart = new TZDate(
        now.getFullYear(),
        now.getMonth(),
        1,
        CARACAS_TZ,
    );
    const initialRangeEnd = new TZDate(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        CARACAS_TZ,
    );
    const calendarRange = await getPsychologistCalendarRange(
        id,
        initialRangeStart,
        initialRangeEnd,
    );

    return (
        <div className="space-y-6">
            <Link
                href={`/admin/psicologos/${id}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                {psychologist.name}
            </Link>

            <PageHeader
                title={`Calendario de ${psychologist.name}`}
                description="Citas por día, días libres y bloqueos de horario"
            />

            <PsychologistDayCalendar
                psychologistId={psychologist.id}
                initialRangeStart={initialRangeStart}
                initialRangeEnd={initialRangeEnd}
                initialData={calendarRange}
            />
        </div>
    );
}
