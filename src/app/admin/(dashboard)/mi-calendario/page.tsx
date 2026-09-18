import { redirect } from "next/navigation";
import Link from "next/link";
import { TZDate } from "@date-fns/tz";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import { CARACAS_TZ } from "@/lib/availability";
import { getTimeOffForPsychologist } from "@/lib/admin/time-off-actions";
import { getPsychologistCalendarMonth } from "@/lib/admin/psychologist-calendar-queries";
import { ScheduleEditor } from "@/components/admin/schedule-editor";
import { TimeOffEditor } from "@/components/admin/time-off-editor";
import { PsychologistDayCalendar } from "@/components/admin/psychologist-day-calendar";
import { WhatsappTemplatesEditor } from "@/components/admin/whatsapp-templates-editor";
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
    const initialYear = now.getFullYear();
    const initialMonth = now.getMonth() + 1;

    const [psychologist, timeOffs, calendarMonth] = await Promise.all([
        prisma.psychologist.findUnique({
            where: { id: actor.psychologistId },
            include: { schedules: true },
        }),
        getTimeOffForPsychologist(actor.psychologistId),
        getPsychologistCalendarMonth(
            actor.psychologistId,
            initialYear,
            initialMonth,
        ),
    ]);

    if (!psychologist) redirect("/admin");

    return (
        <div className="space-y-8">
            <PageHeader
                title="Mi calendario"
                description="Gestiona tu horario semanal y tus días libres"
                actions={
                    <Link href="/admin/citas">
                        <Button variant="outline">Ver mi agenda</Button>
                    </Link>
                }
            />

            <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold">
                    Calendario
                </h2>
                <PsychologistDayCalendar
                    psychologistId={psychologist.id}
                    initialYear={initialYear}
                    initialMonth={initialMonth}
                    initialData={calendarMonth}
                />
            </div>

            <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold">
                    Horario semanal
                </h2>
                <ScheduleEditor
                    psychologistId={psychologist.id}
                    initialSchedules={psychologist.schedules}
                />
            </div>

            <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold">
                    Días libres
                </h2>
                <TimeOffEditor
                    psychologistId={psychologist.id}
                    initialTimeOffs={timeOffs}
                />
            </div>

            <div className="space-y-3">
                <h2 className="font-heading text-lg font-semibold">
                    Plantillas de WhatsApp
                </h2>
                <WhatsappTemplatesEditor
                    psychologistId={psychologist.id}
                    initialReminderTemplate={
                        psychologist.whatsappReminderTemplate
                    }
                    initialTodaySessionTemplate={
                        psychologist.whatsappTodaySessionTemplate
                    }
                />
            </div>
        </div>
    );
}
