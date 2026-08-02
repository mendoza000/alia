"use client";

import { Bell } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminAlert } from "@/lib/admin/alerts-queries";

export function NotificationBell({ alerts }: { alerts: AdminAlert[] }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Notificaciones"
			>
				<Bell className="size-4" />
				{alerts.length > 0 && (
					<span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				<DropdownMenuLabel>Alertas</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{alerts.length === 0 ? (
					<p className="px-1.5 py-2 text-sm text-muted-foreground">
						No hay alertas pendientes
					</p>
				) : (
					alerts.map((alert) => (
						<DropdownMenuItem key={alert.id} render={<a href={alert.href} />}>
							<span className="text-sm">{alert.message}</span>
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
