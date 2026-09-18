import { redirect } from "next/navigation";
import { TZDate } from "@date-fns/tz";
import { requirePermission } from "@/lib/auth/require";
import { CARACAS_TZ } from "@/lib/availability";
import {
    getGlobalCalendarRange,
    getActivePsychologistRoster,
} from "@/lib/admin/global-calendar-queries";
import { AdminGlobalCalendar } from "@/components/admin/admin-global-calendar";
import { PageHeader } from "@/components/admin/page-header";

export default async function GlobalCalendarPage() {
    try {
        await requirePermission("appointment.read.all");
    } catch {
        redirect("/admin");
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

    const [initialData, roster] = await Promise.all([
        getGlobalCalendarRange(initialRangeStart, initialRangeEnd),
        getActivePsychologistRoster(),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Calendario"
                description="Todas las sesiones de todos los psicólogos"
            />
            <AdminGlobalCalendar
                roster={roster}
                initialRangeStart={initialRangeStart}
                initialRangeEnd={initialRangeEnd}
                initialData={initialData}
            />
        </div>
    );
}
