"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import type { Schedule } from "@/generated/prisma/client";
import type { MonthAvailability, TimeSlot } from "@/lib/availability";
import { getMonthAvailability } from "@/app/(landing)/psicologos/[slug]/actions";
import { TimeSlotsPanel } from "./time-slots-panel";
import { cn } from "@/lib/utils";
import type { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";

type AvailabilityCalendarProps = {
  psychologistId: string;
  psychologistSlug: string;
  schedules: Schedule[];
  sessionDuration: number;
  initialAvailability: MonthAvailability;
  initialYear: number;
  initialMonth: number;
};

export function AvailabilityCalendar({
  psychologistId,
  psychologistSlug,
  initialAvailability,
  initialYear,
  initialMonth,
}: AvailabilityCalendarProps) {
  const defaultDate = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const sortedDates = Object.keys(initialAvailability).sort();

    for (const dateStr of sortedDates) {
      if (dateStr >= today && initialAvailability[dateStr]?.status === "available") {
        return new Date(`${dateStr}T12:00:00`);
      }
    }
    return undefined;
  }, [initialAvailability]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [isPending, startTransition] = useTransition();
  const cacheRef = useRef<Map<string, MonthAvailability>>(
    new Map([[`${initialYear}-${initialMonth}`, initialAvailability]]),
  );
  const [availability, setAvailability] =
    useState<MonthAvailability>(initialAvailability);

  function handleMonthChange(month: Date) {
    const year = month.getFullYear();
    const m = month.getMonth() + 1;
    const key = `${year}-${m}`;

    const cached = cacheRef.current.get(key);
    if (cached) {
      setAvailability(cached);
      return;
    }

    startTransition(async () => {
      const data = await getMonthAvailability(psychologistId, year, m);
      cacheRef.current.set(key, data);
      setAvailability(data);
    });
  }

  const availableDates: Date[] = [];
  const fullyBookedDates: Date[] = [];
  const noScheduleDates: Date[] = [];

  for (const [dateStr, day] of Object.entries(availability)) {
    const date = new Date(`${dateStr}T12:00:00`);
    if (day.status === "available") availableDates.push(date);
    else if (day.status === "fully_booked") fullyBookedDates.push(date);
    else noScheduleDates.push(date);
  }

  const selectedSlots: TimeSlot[] = selectedDate
    ? (availability[format(selectedDate, "yyyy-MM-dd")]?.slots ?? [])
    : [];

  return (
    <div className="rounded-lg bg-card ring-1 ring-border/50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
        <TimeSlotsPanel
          date={selectedDate ?? null}
          slots={selectedSlots}
          psychologistSlug={psychologistSlug}
        />

        <div
          className={cn(
            "transition-opacity duration-300",
            isPending && "opacity-50",
          )}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonthChange={handleMonthChange}
            locale={es}
            defaultMonth={new Date(initialYear, initialMonth - 1)}
            disabled={[...noScheduleDates, ...fullyBookedDates]}
            modifiers={{
              available: availableDates,
              fullyBooked: fullyBookedDates,
            }}
            components={{
              DayButton: props => (
                <AvailabilityDayButton
                  availability={availability}
                  {...props}
                />
              ),
            }}
            className="mx-auto w-fit [--cell-size:--spacing(10)]"
          />
        </div>
      </div>
    </div>
  );
}

function AvailabilityDayButton({
  availability,
  day,
  modifiers,
  className,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  availability: MonthAvailability;
}) {
  const dateStr = format(day.date, "yyyy-MM-dd");
  const dayData = availability[dateStr];
  const status = dayData?.status;

  return (
    <Button
      variant="ghost"
      size="icon"
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center gap-0.5 border-0 leading-none font-normal data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        status === "fully_booked" && "opacity-60 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {props.children}
      {status === "available" && (
        <span className="block h-1 w-1 rounded-full bg-accent" />
      )}
      {status === "fully_booked" && (
        <span className="block h-1 w-1 rounded-full bg-destructive" />
      )}
    </Button>
  );
}
