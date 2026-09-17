import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/require";
import {
    getStaffUsers,
    getUnlinkedPsychologists,
} from "@/lib/admin/staff-queries";
import { StaffSheet } from "@/components/admin/staff-sheet";
import { StaffTable } from "@/components/admin/staff-table";

export default async function StaffPage() {
    // Nav already hides this link from non-admins and the actions underneath
    // are permission-checked, but this page is the entry point for creating
    // new admin accounts — worth a page-level gate rather than leaning only
    // on the shared /admin layout's "any staff role" check.
    try {
        await requirePermission("staff.write");
    } catch {
        redirect("/admin");
    }

    const [users, unlinkedPsychologists] = await Promise.all([
        getStaffUsers(),
        getUnlinkedPsychologists(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-semibold">
                        Equipo
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona las cuentas de administradores, asistentes y
                        psicólogos
                    </p>
                </div>
                <StaffSheet unlinkedPsychologists={unlinkedPsychologists} />
            </div>
            <StaffTable users={users} />
        </div>
    );
}
