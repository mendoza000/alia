import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getLatestIntakeFormByUser } from "@/lib/queries/intake-forms";

export const metadata: Metadata = {
    title: "Mi cuenta",
};

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function MiCuentaPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    if (!user) return null;

    const latestForm = await getLatestIntakeFormByUser(user.id);
    const formData = latestForm?.data as Record<string, unknown> | null;
    const phone = typeof formData?.phone === "string" ? formData.phone : null;

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <h1 className="font-heading text-3xl font-bold">Mi cuenta</h1>

            <div className="mt-8 rounded-lg bg-card p-6 ring-1 ring-border/50">
                <div className="flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt=""
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="font-heading text-xl text-muted-foreground">
                                    {getInitials(user.name)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{user.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {user.email}
                        </p>
                        {phone && (
                            <p className="text-sm text-muted-foreground">
                                {phone}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                    <Link
                        href="/mi-cuenta/citas"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Mis citas
                    </Link>
                    <SignOutButton />
                </div>
            </div>
        </div>
    );
}
