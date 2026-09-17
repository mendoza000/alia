"use client";

import { useState } from "react";
import { MoreHorizontal, Power } from "lucide-react";
import { toast } from "sonner";
import { setStaffUserBanned, updateStaffRole } from "@/lib/admin/staff-actions";
import type { Role } from "@/lib/auth/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type StaffUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean;
    psychologistProfile: { id: string; name: string } | null;
};

const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    assistant: "Asistente",
    psychologist: "Psicólogo",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function StaffTable({ users }: { users: StaffUser[] }) {
    const [pendingId, setPendingId] = useState<string | null>(null);

    async function handleToggleBanned(user: StaffUser) {
        setPendingId(user.id);
        try {
            await setStaffUserBanned(user.id, !user.banned);
            toast.success(
                user.banned ? "Usuario activado" : "Usuario desactivado",
            );
        } catch {
            toast.error("Error al cambiar el estado");
        } finally {
            setPendingId(null);
        }
    }

    async function handleRoleChange(user: StaffUser, role: Role) {
        setPendingId(user.id);
        try {
            await updateStaffRole(user.id, role);
            toast.success("Rol actualizado");
        } catch {
            toast.error("Error al cambiar el rol");
        } finally {
            setPendingId(null);
        }
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No hay usuarios de staff registrados
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
                <TableHeader className="[&_th]:font-semibold">
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Vinculado a</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">
                                    {ROLE_LABELS[user.role] ?? user.role}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {user.psychologistProfile?.name ?? "—"}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        user.banned ? "outline" : "default"
                                    }
                                    className={
                                        !user.banned
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : ""
                                    }
                                >
                                    {user.banned ? "Desactivado" : "Activo"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                disabled={pendingId === user.id}
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        }
                                    />
                                    <DropdownMenuContent align="end">
                                        {user.role !== "psychologist" && (
                                            <>
                                                <DropdownMenuItem
                                                    disabled={
                                                        user.role === "admin"
                                                    }
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            user,
                                                            "admin",
                                                        )
                                                    }
                                                >
                                                    Hacer administrador
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    disabled={
                                                        user.role ===
                                                        "assistant"
                                                    }
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            user,
                                                            "assistant",
                                                        )
                                                    }
                                                >
                                                    Hacer asistente
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleToggleBanned(user)
                                            }
                                        >
                                            <Power />
                                            {user.banned
                                                ? "Activar"
                                                : "Desactivar"}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
