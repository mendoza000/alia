import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";

export default async function AdminDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const userName = session?.user?.name ?? "Admin";
	const initials = userName
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<>
			<AdminShell userName={userName} initials={initials}>
				{children}
			</AdminShell>
			<Toaster position="top-right" richColors />
		</>
	);
}
