"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { approveRequest, rejectRequest } from "@/lib/admin/approval-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

export function DecideApprovalDialog({
    approvalId,
    mode,
    open,
    onOpenChange,
}: {
    approvalId: string;
    mode: "approve" | "reject";
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const router = useRouter();

    async function handleConfirm() {
        setIsSaving(true);
        const result =
            mode === "approve"
                ? await approveRequest(approvalId, note || undefined)
                : await rejectRequest(approvalId, note || undefined);

        if (result.success) {
            toast.success(
                mode === "approve"
                    ? "Solicitud aprobada"
                    : "Solicitud rechazada",
            );
            router.refresh();
            const url = (result as { url?: string }).url;
            if (mode === "approve" && url) {
                setGeneratedUrl(url);
            } else {
                onOpenChange(false);
            }
        } else {
            toast.error(result.error);
        }
        setIsSaving(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={next => {
                if (next) {
                    setNote("");
                    setGeneratedUrl(null);
                }
                onOpenChange(next);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "approve"
                            ? "Aprobar solicitud"
                            : "Rechazar solicitud"}
                    </DialogTitle>
                    <DialogDescription>
                        Puedes agregar una nota opcional visible para quien la
                        solicitó.
                    </DialogDescription>
                </DialogHeader>

                {generatedUrl ? (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Link de pago generado con el nuevo monto:
                        </p>
                        <div className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2">
                            <p className="truncate text-sm text-muted-foreground">
                                {generatedUrl}
                            </p>
                        </div>
                        <CopyLinkButton
                            text={generatedUrl}
                            label="Copiar link de pago"
                            showLabel
                            variant="outline"
                            className="w-full"
                        />
                    </div>
                ) : (
                    <Textarea
                        rows={4}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Nota (opcional)..."
                    />
                )}

                <DialogFooter>
                    {generatedUrl ? (
                        <Button onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    ) : (
                        <>
                            <DialogClose render={<Button variant="outline" />}>
                                Cancelar
                            </DialogClose>
                            <Button
                                variant={
                                    mode === "reject"
                                        ? "destructive"
                                        : "default"
                                }
                                onClick={handleConfirm}
                                isLoading={isSaving}
                            >
                                {mode === "approve" ? "Aprobar" : "Rechazar"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
