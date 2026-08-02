"use client";

import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import Link from "next/link";
import { ease } from "@/lib/motion";
import { BOGOTA_TZ, toBogotaDate, type TimeSlot } from "@/lib/availability";

type TimeSlotsPanelProps = {
    date: Date | null;
    slots: TimeSlot[];
    psychologistSlug: string;
    onSlotSelect?: (date: string, time: string) => void;
    patientTimezone?: string;
};

function formatInTimezone(
    dateStr: string,
    time: string,
    timezone: string,
): string {
    const bogotaInstant = toBogotaDate(dateStr, time);
    return format(new TZDate(bogotaInstant, timezone), "h:mm a");
}

export function TimeSlotsPanel({
    date,
    slots,
    psychologistSlug,
    onSlotSelect,
    patientTimezone,
}: TimeSlotsPanelProps) {
    const showLocalTime =
        !!patientTimezone && patientTimezone !== BOGOTA_TZ;
    return (
        <div className="min-h-[200px]">
            {date ? (
                <div>
                    <h3 className="mb-1 text-lg font-semibold text-foreground">
                        Horarios disponibles
                    </h3>
                    <p
                        className={`text-sm font-medium capitalize text-foreground ${showLocalTime ? "mb-1" : "mb-3"}`}
                    >
                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    {showLocalTime && (
                        <p className="mb-3 text-xs text-muted-foreground">
                            Horarios en hora de Colombia · convertidos a tu
                            zona horaria debajo
                        </p>
                    )}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={date.toISOString()}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.25, ease }}
                            className="max-h-[320px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {slots.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {slots.map((slot, index) => {
                                        const dateStr = format(
                                            date,
                                            "yyyy-MM-dd",
                                        );
                                        const slotClassName =
                                            "w-full flex flex-col items-center justify-center gap-0.5 rounded-lg bg-background px-3 py-2.5 text-base ring-1 ring-border/50 transition-colors hover:bg-accent/20";
                                        const localTime = showLocalTime
                                            ? formatInTimezone(
                                                  dateStr,
                                                  slot.start,
                                                  patientTimezone!,
                                              )
                                            : null;
                                        const slotContent = (
                                            <>
                                                <span>{slot.start}</span>
                                                {localTime && (
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        {localTime} tu hora
                                                    </span>
                                                )}
                                            </>
                                        );
                                        return (
                                            <motion.div
                                                key={slot.start}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease,
                                                    delay: index * 0.03,
                                                }}
                                            >
                                                {onSlotSelect ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onSlotSelect(
                                                                dateStr,
                                                                slot.start,
                                                            )
                                                        }
                                                        className={
                                                            slotClassName
                                                        }
                                                    >
                                                        {slotContent}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={`/agendar/${psychologistSlug}?date=${dateStr}&time=${slot.start}`}
                                                        className={
                                                            slotClassName
                                                        }
                                                    >
                                                        {slotContent}
                                                    </Link>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sin horarios disponibles para este día
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Selecciona un día para ver los horarios disponibles
                </p>
            )}
        </div>
    );
}
