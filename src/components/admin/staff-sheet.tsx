"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StaffForm } from "@/components/admin/staff-form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";

export function StaffSheet({
    unlinkedPsychologists,
}: {
    unlinkedPsychologists: { id: string; name: string; email: string }[];
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const formId = "staff-form-new";

    function handleSuccess() {
        setOpen(false);
        router.refresh();
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
                <Plus />
                Agregar usuario
            </Button>
            <SheetContent
                side="right"
                className="flex h-full w-full flex-col bg-card sm:min-w-lg"
            >
                <SheetHeader>
                    <SheetTitle className="font-sans text-lg font-semibold">
                        Agregar usuario de staff
                    </SheetTitle>
                    <SheetDescription>
                        Le enviaremos un correo para que configure su contraseña
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4">
                    <StaffForm
                        unlinkedPsychologists={unlinkedPsychologists}
                        onSuccess={handleSuccess}
                        formId={formId}
                    />
                </div>
                <SheetFooter className="border-t px-4 py-3">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" form={formId}>
                        Crear usuario
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
