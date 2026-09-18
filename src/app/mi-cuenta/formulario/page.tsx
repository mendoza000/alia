import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditIntakeFormFlow } from "./edit-intake-form-flow";

export const metadata: Metadata = {
    title: "Editar mi Inventario de Vida",
};

export default async function EditarFormularioPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/");

    const form = await prisma.intakeForm.findUnique({
        where: { userId: session.user.id },
        select: { data: true },
    });
    if (!form) redirect("/mi-cuenta");

    return (
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Editar mi Inventario de Vida
                </h1>
                <Link
                    href="/mi-cuenta"
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Mi cuenta
                </Link>
            </div>

            <EditIntakeFormFlow
                priorData={form.data as Record<string, unknown>}
            />
        </div>
    );
}
