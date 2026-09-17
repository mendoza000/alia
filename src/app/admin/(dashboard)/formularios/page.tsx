import { prisma } from "@/lib/db";
import { IntakeFormTable } from "@/components/admin/intake-form-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export default async function FormulariosPage() {
    const intakeForms = await prisma.intakeForm.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    appointments: {
                        orderBy: { dateTime: "desc" },
                        take: 1,
                        select: {
                            id: true,
                            dateTime: true,
                            psychologist: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Formularios"
                description="Formularios de inventario de vida de las personas"
                actions={
                    <a
                        href="/api/admin/formularios/export.csv"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button variant="outline" size="sm">
                            Exportar CSV
                        </Button>
                    </a>
                }
            />

            <IntakeFormTable forms={intakeForms} />
        </div>
    );
}
