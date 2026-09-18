import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLatestIntakeFormByUser } from "@/lib/queries/intake-forms";
import { MyProfileForm } from "@/components/patient/my-profile-form";

export const metadata: Metadata = {
    title: "Mi perfil",
};

export default async function MiPerfilPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    if (!user) return null;

    const latestForm = await getLatestIntakeFormByUser(user.id);
    const formData = latestForm?.data as Record<string, unknown> | null;
    const phone = typeof formData?.phone === "string" ? formData.phone : "";
    const dateOfBirth =
        typeof formData?.dateOfBirth === "string" ? formData.dateOfBirth : "";

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold">Mi perfil</h1>
                <Link
                    href="/mi-cuenta"
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Mi cuenta
                </Link>
            </div>

            <div className="mt-8 rounded-lg bg-card p-6 ring-1 ring-border/50">
                <MyProfileForm
                    name={user.name}
                    email={user.email}
                    phone={phone}
                    dateOfBirth={dateOfBirth}
                />
            </div>
        </div>
    );
}
