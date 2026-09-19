"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

/** Calendar-popover date input, storing/emitting "yyyy-MM-dd" strings.
 * Shared by FormDatePicker (react-hook-form fields) and any plain
 * useState-driven form that needs the same picker without a form context. */
export function DatePickerInput({
    id,
    value,
    onChange,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedDate = value
        ? parse(value, "yyyy-MM-dd", new Date())
        : undefined;

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                id={id}
                className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    !value && "text-muted-foreground",
                )}
            >
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                {selectedDate
                    ? format(selectedDate, "d 'de' MMMM, yyyy", {
                          locale: es,
                      })
                    : "Selecciona una fecha"}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner sideOffset={4}>
                    <Popover.Popup className="z-50 rounded-lg border border-border bg-card p-0 shadow-md outline-none">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={date => {
                                if (date) {
                                    onChange(format(date, "yyyy-MM-dd"));
                                    setOpen(false);
                                }
                            }}
                            captionLayout="dropdown"
                            fromYear={1930}
                            toYear={CURRENT_YEAR - 10}
                            defaultMonth={selectedDate ?? new Date(1995, 0)}
                            locale={es}
                        />
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
