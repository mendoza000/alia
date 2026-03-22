"use client";

import {
	Calendar,
	CreditCard,
	DollarSign,
	FileText,
	LayoutDashboard,
	Tag,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navSections = [
	{
		label: "GENERAL",
		items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
	},
	{
		label: "GESTIÓN",
		items: [
			{ href: "/admin/psicologos", label: "Psicólogos", icon: Users },
			{ href: "/admin/citas", label: "Citas", icon: Calendar },
			{
				href: "/admin/formularios",
				label: "Formularios",
				icon: FileText,
			},
			{ href: "/admin/pagos", label: "Pagos", icon: CreditCard },
			{ href: "/admin/finanzas", label: "Finanzas", icon: DollarSign },
			{ href: "/admin/cupones", label: "Cupones", icon: Tag },
		],
	},
];

export function SidebarNav({
	onNavigate,
}: { onNavigate?: () => void } = {}) {
	const pathname = usePathname();

	function isActive(href: string) {
		if (href === "/admin") return pathname === "/admin";
		return pathname.startsWith(href);
	}

	return (
		<nav className="flex-1 space-y-6 px-3 py-4">
			{navSections.map((section) => (
				<div key={section.label}>
					<p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
						{section.label}
					</p>
					<div className="space-y-1">
						{section.items.map((item) => {
							const active = isActive(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => onNavigate?.()}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
										active
											? "border-l-3 border-accent bg-accent/15 font-medium text-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<item.icon className="size-4" />
									{item.label}
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}
