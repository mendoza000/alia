"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS, matchTimezoneOption } from "@/lib/timezones";

/** Extracted from agendar/[slug]/booking-flow.tsx (Fase 7.2) — shared
 * verbatim between the direct-slug flow and the new modality-first flow. */
export function TimezoneConfirmStep({
    detectedTimezone,
    onConfirm,
}: {
    detectedTimezone: string;
    onConfirm: (timezone: string) => void;
}) {
    const detectedOption = useMemo(
        () => matchTimezoneOption(detectedTimezone),
        [detectedTimezone],
    );
    const [selected, setSelected] = useState(detectedOption.value);
    const hasManualSelection = useRef(false);

    // detectedTimezone starts as a hydration-safe placeholder and is
    // corrected right after mount (see BookingFlow). Follow that correction
    // until the patient picks a value themselves.
    useEffect(() => {
        if (!hasManualSelection.current) setSelected(detectedOption.value);
    }, [detectedOption.value]);

    const options = useMemo(() => {
        const hasDetected = TIMEZONE_OPTIONS.some(
            o => o.value === detectedOption.value,
        );
        return hasDetected
            ? TIMEZONE_OPTIONS
            : [detectedOption, ...TIMEZONE_OPTIONS];
    }, [detectedOption]);

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Detectamos que tu zona horaria es
                </p>
                <p className="mt-1 font-medium">{detectedOption.label}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                    Tu sesión se mostrará en esta hora para evitar confusiones.
                    ¿Es correcta?
                </p>

                <div className="mt-5 flex justify-center">
                    <Select
                        items={options}
                        value={selected}
                        onValueChange={value => {
                            if (value) {
                                hasManualSelection.current = true;
                                setSelected(value);
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map(o => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={() => onConfirm(selected)}
                    className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/80"
                    size="lg"
                >
                    Confirmar
                </Button>
            </div>
        </div>
    );
}
