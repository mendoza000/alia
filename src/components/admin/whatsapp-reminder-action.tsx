"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { normalizeWhatsappPhone, buildWhatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function sendWhatsappReminder(phone: string | null, message: string) {
    const normalized = normalizeWhatsappPhone(phone);
    if (!normalized) {
        toast.error(
            "Este paciente no tiene un número de WhatsApp válido registrado",
        );
        return;
    }
    window.open(
        buildWhatsappLink(normalized, message),
        "_blank",
        "noopener,noreferrer",
    );
}

export function WhatsappReminderMenuItem({
    phone,
    message,
}: {
    phone: string | null;
    message: string;
}) {
    return (
        <DropdownMenuItem onClick={() => sendWhatsappReminder(phone, message)}>
            <MessageCircle />
            Enviar recordatorio por WhatsApp
        </DropdownMenuItem>
    );
}

export function WhatsappReminderButton({
    phone,
    message,
}: {
    phone: string | null;
    message: string;
}) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => sendWhatsappReminder(phone, message)}
        >
            <MessageCircle />
            WhatsApp
        </Button>
    );
}
