"use client";

import { useState } from "react";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

function SidebarHeader() {
	return (
		<div className="flex items-center justify-between gap-3 border-b border-border px-6 py-1">
			<Image
				src="/logo-alia.png"
				alt="ALIA"
				width={40}
				height={40}
				className="h-auto"
			/>
			<Badge variant="secondary" className="text-[10px]">
				Admin
			</Badge>
		</div>
	);
}

function SidebarFooter({
	userName,
	initials,
}: { userName: string; initials: string }) {
	return (
		<div className="mt-auto border-t border-border p-4">
			<div className="flex items-center gap-3">
				<Avatar size="sm">
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{userName}</p>
					<p className="text-xs text-muted-foreground">Administrador</p>
				</div>
				<SignOutButton
					redirectTo="/admin/login"
					variant="ghost"
					size="sm"
					className="size-8 p-0"
				>
					<LogOut className="size-4" />
				</SignOutButton>
			</div>
		</div>
	);
}

export function AdminShell({
	userName,
	initials,
	children,
}: {
	userName: string;
	initials: string;
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex min-h-screen overflow-hidden">
			{/* Desktop sidebar */}
			<aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
				<SidebarHeader />
				<SidebarNav />
				<SidebarFooter userName={userName} initials={initials} />
			</aside>

			{/* Mobile sidebar (Sheet) */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent
					side="left"
					className="flex w-64 flex-col p-0"
					showCloseButton={false}
				>
					<SheetTitle className="sr-only">Menú de navegación</SheetTitle>
					<SidebarHeader />
					<SidebarNav onNavigate={() => setSidebarOpen(false)} />
					<SidebarFooter userName={userName} initials={initials} />
				</SheetContent>
			</Sheet>

			{/* Main content */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex min-w-0 items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
					<div className="flex items-center gap-3">
						{/* Mobile hamburger */}
						<button
							type="button"
							onClick={() => setSidebarOpen(true)}
							className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
						>
							<Menu className="size-5" />
						</button>
						<span className="text-sm text-muted-foreground">Dashboard</span>
					</div>
					<div className="flex items-center gap-3">
						{/* Search placeholder — hidden on mobile */}
						<div className="hidden items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground md:flex">
							<Search className="size-3.5" />
							<span>Buscar...</span>
							<kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
								⌘K
							</kbd>
						</div>
						{/* Notification bell */}
						<button
							type="button"
							className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Bell className="size-4" />
							<span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
						</button>
					</div>
				</header>
				<main className="min-w-0 flex-1 overflow-x-auto bg-background p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
