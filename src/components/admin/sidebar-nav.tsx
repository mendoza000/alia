"use client";

import {
    Banknote,
    Calendar,
    CalendarClock,
    ClipboardCheck,
    CreditCard,
    DollarSign,
    FileText,
    LayoutDashboard,
    MessageCircle,
    Tag,
    UserCog,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { can, type Permission, type Role } from "@/lib/auth/permissions";

type NavItem = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    /** Omitted = visible to every staff role. */
    permission?: Permission;
    /** Any-of alternative to `permission`, for items whose visibility
     * comes from different permissions depending on role (e.g. Clientes:
     * intake.read.all for admin/assistant, intake.read.own for
     * psychologist — no single permission covers both). */
    anyPermission?: Permission[];
    /** Restricts to specific roles regardless of permission — for pages
     * that are inherently "your own" (like Mi calendario) where admin
     * having every Permission via ALL_PERMISSIONS would otherwise also
     * show it, even though admin manages schedules through
     * /admin/psicologos, not a personal calendar of their own. */
    roles?: Role[];
};

const navSections: { label: string; items: NavItem[] }[] = [
    {
        label: "GENERAL",
        items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
        label: "GESTIÓN",
        items: [
            {
                href: "/admin/psicologos",
                label: "Psicólogos",
                icon: Users,
                permission: "psychologist.write",
            },
            {
                href: "/admin/mi-calendario",
                label: "Mi calendario",
                icon: CalendarClock,
                permission: "schedule.write.own",
                roles: ["psychologist"],
            },
            // /admin/citas and /admin/pagos are read-scoped by actor since
            // Fase 4.0 (resolvePsychologistScope) — a psychologist only ever
            // sees their own sessions/payments there, so these are safe to
            // show them now on the permission they actually hold.
            {
                href: "/admin/citas",
                label: "Sesiones",
                icon: Calendar,
                permission: "appointment.write",
            },
            {
                href: "/admin/clientes",
                label: "Clientes",
                icon: FileText,
                anyPermission: ["intake.read.all", "intake.read.own"],
            },
            {
                href: "/admin/pagos",
                label: "Pagos",
                icon: CreditCard,
                permission: "payment.link.create",
            },
            {
                href: "/admin/finanzas",
                label: "Finanzas",
                icon: DollarSign,
                permission: "finance.read",
            },
            {
                href: "/admin/cupones",
                label: "Cupones",
                icon: Tag,
                permission: "coupon.write",
            },
            {
                href: "/admin/tarifas",
                label: "Tarifas",
                icon: Banknote,
                permission: "rate.write",
            },
            {
                href: "/admin/contacto",
                label: "Contacto",
                icon: MessageCircle,
                permission: "settings.write",
            },
            {
                href: "/admin/equipo",
                label: "Equipo",
                icon: UserCog,
                permission: "staff.write",
            },
            {
                href: "/admin/aprobaciones",
                label: "Aprobaciones",
                icon: ClipboardCheck,
                anyPermission: ["approval.request", "approval.decide"],
            },
        ],
    },
];

export function SidebarNav({
    role,
    onNavigate,
}: {
    role: Role;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();

    function isActive(href: string) {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    }

    return (
        <nav className="flex-1 space-y-6 px-3 py-4">
            {navSections.map(section => {
                const items = section.items.filter(
                    item =>
                        (!item.permission || can(role, item.permission)) &&
                        (!item.anyPermission ||
                            item.anyPermission.some(p => can(role, p))) &&
                        (!item.roles || item.roles.includes(role)),
                );
                if (items.length === 0) return null;
                return (
                    <div key={section.label}>
                        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                            {section.label}
                        </p>
                        <div className="space-y-1">
                            {items.map(item => {
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
                );
            })}
        </nav>
    );
}
