"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updateMyProfile } from "@/lib/patient/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/form/date-picker-input";

/**
 * Same view/edit-toggle shape as the admin's PatientProfileEditor, calling
 * updateMyProfile instead (always self, no userId prop) — email is
 * intentionally not editable here either, same reasoning: it's better-auth's
 * login identifier.
 */
export function MyProfileForm({
    name,
    email,
    phone,
    dateOfBirth,
}: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [formName, setFormName] = useState(name);
    const [formPhone, setFormPhone] = useState(phone);
    const [formDob, setFormDob] = useState(dateOfBirth);
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        startTransition(async () => {
            const result = await updateMyProfile({
                name: formName,
                phone: formPhone,
                dateOfBirth: formDob,
            });
            if (result.success) {
                toast.success("Perfil actualizado");
                setEditing(false);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    }

    if (!editing) {
        return (
            <div className="flex items-start justify-between gap-3">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Nombre</dt>
                        <dd>{name}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Correo</dt>
                        <dd>{email}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Teléfono</dt>
                        <dd>{phone || "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">
                            Fecha de nacimiento
                        </dt>
                        <dd>{dateOfBirth || "—"}</dd>
                    </div>
                </dl>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                >
                    <Pencil />
                    Editar
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="my-profile-name">Nombre</Label>
                    <Input
                        id="my-profile-name"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="my-profile-phone">Teléfono</Label>
                    <Input
                        id="my-profile-phone"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="my-profile-dob">Fecha de nacimiento</Label>
                    <DatePickerInput
                        id="my-profile-dob"
                        value={formDob}
                        onChange={setFormDob}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleSave} isLoading={isPending}>
                    <Save />
                    Guardar
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        setEditing(false);
                        setFormName(name);
                        setFormPhone(phone);
                        setFormDob(dateOfBirth);
                    }}
                >
                    <X />
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
