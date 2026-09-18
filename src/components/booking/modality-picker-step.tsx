"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { Users, UserRound } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/currency";
import { CARACAS_TZ } from "@/lib/availability";
import type { SessionType } from "@/generated/prisma/enums";

export type ModalityStatus =
    | { blocked: false }
    | { blocked: true; dateTime: Date; timezone: string | null };

type ModalityCardConfig = {
    sessionType: SessionType;
    title: string;
    description: string;
    icon: typeof Users;
    duration: number;
    rate: { amount: number; currency: string } | null;
    status: ModalityStatus;
};

/** Fase 7.2, paso 0 del nuevo flujo /agendar: elegir modalidad antes de ver
 * horarios — el match y la duración del slot dependen de ella. Una tarjeta
 * bloqueada (ya tiene una sesión activa de esa modalidad) se deshabilita en
 * vez de navegar, con el mismo tipo de copy que ActiveAppointmentNotice. */
export function ModalityPickerStep({
    individualStatus,
    coupleStatus,
    individualRate,
    coupleRate,
    onSelect,
}: {
    individualStatus: ModalityStatus;
    coupleStatus: ModalityStatus;
    individualRate: { amount: number; currency: string } | null;
    coupleRate: { amount: number; currency: string } | null;
    onSelect: (sessionType: SessionType) => void;
}) {
    const cards: ModalityCardConfig[] = [
        {
            sessionType: "INDIVIDUAL",
            title: "Individual",
            description: "Un espacio propio para ti.",
            icon: UserRound,
            duration: 60,
            rate: individualRate,
            status: individualStatus,
        },
        {
            sessionType: "COUPLE",
            title: "Pareja",
            description: "Un espacio para trabajar juntos.",
            icon: Users,
            duration: 120,
            rate: coupleRate,
            status: coupleStatus,
        },
    ];

    return (
        <div className="mx-auto max-w-2xl">
            <p className="mb-6 text-center text-sm text-muted-foreground">
                ¿Qué tipo de sesión quieres agendar?
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
                {cards.map(card => (
                    <ModalityCard
                        key={card.sessionType}
                        card={card}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}

function ModalityCard({
    card,
    onSelect,
}: {
    card: ModalityCardConfig;
    onSelect: (sessionType: SessionType) => void;
}) {
    const Icon = card.icon;

    if (card.status.blocked) {
        const dateTimeInTz = new TZDate(
            card.status.dateTime,
            card.status.timezone ?? CARACAS_TZ,
        );
        const formattedDate = format(dateTimeInTz, "EEEE d 'de' MMMM, HH:mm", {
            locale: es,
        });
        return (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-left opacity-75">
                <Icon className="size-6 text-muted-foreground" />
                <p className="font-medium">{card.title}</p>
                <p className="text-sm text-muted-foreground">
                    Ya tienes una sesión {card.title.toLowerCase()} activa el{" "}
                    <span className="capitalize">{formattedDate}</span>.
                </p>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onSelect(card.sessionType)}
            className="flex flex-col gap-3 rounded-lg bg-card p-6 text-left ring-1 ring-border/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
            <Icon className="size-6 text-accent" />
            <div>
                <p className="font-semibold">{card.title}</p>
                <p className="text-sm text-muted-foreground">
                    {card.description}
                </p>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {card.duration} min
                </span>
                <span className="font-medium">
                    {card.rate
                        ? formatCurrencyAmount(
                              card.rate.amount,
                              card.rate.currency,
                          )
                        : "Se coordina con tu psicólogo"}
                </span>
            </div>
        </button>
    );
}
