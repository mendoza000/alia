import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { TZDate } from "@date-fns/tz";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import { CARACAS_TZ } from "@/lib/availability";
import { getPsychologistCalendarRange } from "@/lib/admin/psychologist-calendar-queries";
import { PsychologistDayCalendar } from "@/components/admin/psychologist-day-calendar";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export default async function MiCalendarioPage() {
    let actor: Awaited<ReturnType<typeof requirePermission>>;
    try {
        actor = await requirePermission("schedule.write.own");
    } catch {
        redirect("/admin");
    }

    if (!actor.psychologistId) {
        return (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                Tu cuenta no está vinculada a un perfil de psicólogo. Contacta a
                un administrador.
            </div>
        );
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

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: actor.psychologistId },
        select: { id: true },
    });
    if (!psychologist) redirect("/admin");

    const calendarRange = await getPsychologistCalendarRange(
        psychologist.id,
        initialRangeStart,
        initialRangeEnd,
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mi calendario"
                description="Tus citas, días libres y bloqueos de horario"
                actions={
                    <Link href="/admin/mi-calendario/ajustes">
                        <Button variant="outline">
                            <Settings />
                            Horario y plantillas
                        </Button>
                    </Link>
                }
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
