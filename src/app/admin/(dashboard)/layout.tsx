import {
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  Tag,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/psicologos", label: "Psicólogos", icon: Users },
  { href: "/admin/citas", label: "Citas", icon: Calendar },
  { href: "/admin/formularios", label: "Formularios", icon: FileText },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/finanzas", label: "Finanzas", icon: DollarSign },
  { href: "/admin/cupones", label: "Cupones", icon: Tag },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h1 className="font-heading text-xl">ALIA Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name ?? session?.user?.email}
          </span>
          <SignOutButton redirectTo="/admin/login" />
        </header>
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
