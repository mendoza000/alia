import { headers } from "next/headers";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function MiCuentaPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="mx-auto max-w-lg px-4 py-12">
            <h1 className="font-heading text-2xl">Mi cuenta</h1>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>{session?.user?.name ?? "Paciente"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {session?.user?.email}
                    </p>
                    <SignOutButton />
                </CardContent>
            </Card>
        </div>
    );
}
