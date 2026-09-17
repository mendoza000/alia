"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { addPatientNote } from "@/lib/admin/patient-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type NoteRow = {
    id: string;
    body: string;
    createdAt: Date;
    psychologist: { name: string };
};

/** Append-only feed, not a copy of appointment-notes-dialog.tsx's single
 * mutable field — a patient accumulates many timestamped notes from
 * whoever has treated them, with no edit/delete in this first pass. */
export function PatientNotes({
    userId,
    notes,
}: {
    userId: string;
    notes: NoteRow[];
}) {
    const router = useRouter();
    const [body, setBody] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleAdd() {
        if (!body.trim()) return;
        startTransition(async () => {
            const result = await addPatientNote(userId, body);
            if (result.success) {
                setBody("");
                toast.success("Nota agregada");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Agregar una nota sobre este paciente..."
                    rows={3}
                />
                <Button
                    onClick={handleAdd}
                    isLoading={isPending}
                    disabled={!body.trim()}
                    className="w-fit"
                >
                    Agregar nota
                </Button>
            </div>

            {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No hay notas registradas.
                </p>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className="rounded-lg border border-border bg-card p-3"
                        >
                            <p className="text-sm whitespace-pre-wrap">
                                {note.body}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {note.psychologist.name} ·{" "}
                                {format(note.createdAt, "d MMM yyyy, HH:mm", {
                                    locale: es,
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
