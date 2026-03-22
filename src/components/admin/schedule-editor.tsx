"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveSchedules } from "@/lib/admin/schedule-actions";
import type { ScheduleBlockData } from "@/lib/validators/schedule";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

// Display order: Monday (1) through Sunday (0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

interface ScheduleEditorProps {
  psychologistId: string;
  initialSchedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}

interface DaySchedule {
  isActive: boolean;
  blocks: { startTime: string; endTime: string }[];
}

function buildInitialState(
  initialSchedules: ScheduleEditorProps["initialSchedules"],
): Record<number, DaySchedule> {
  const state: Record<number, DaySchedule> = {};
  for (const day of DAY_ORDER) {
    state[day] = { isActive: false, blocks: [] };
  }
  for (const s of initialSchedules) {
    if (!state[s.dayOfWeek]) {
      state[s.dayOfWeek] = { isActive: false, blocks: [] };
    }
    state[s.dayOfWeek].isActive = s.isActive;
    state[s.dayOfWeek].blocks.push({
      startTime: s.startTime,
      endTime: s.endTime,
    });
  }
  return state;
}

export function ScheduleEditor({
  psychologistId,
  initialSchedules,
}: ScheduleEditorProps) {
  const [days, setDays] = useState(() => buildInitialState(initialSchedules));
  const [isPending, startTransition] = useTransition();

  function toggleDay(day: number, checked: boolean) {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive: checked,
        blocks:
          checked && prev[day].blocks.length === 0
            ? [{ startTime: "08:00", endTime: "17:00" }]
            : prev[day].blocks,
      },
    }));
  }

  function addBlock(day: number) {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: [...prev[day].blocks, { startTime: "08:00", endTime: "17:00" }],
      },
    }));
  }

  function removeBlock(day: number, index: number) {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.filter((_, i) => i !== index),
      },
    }));
  }

  function updateBlock(
    day: number,
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        blocks: prev[day].blocks.map((b, i) =>
          i === index ? { ...b, [field]: value } : b,
        ),
      },
    }));
  }

  function handleSave() {
    const blocks: ScheduleBlockData[] = [];
    for (const day of DAY_ORDER) {
      const dayData = days[day];
      if (dayData.blocks.length === 0) continue;
      for (const block of dayData.blocks) {
        if (block.endTime <= block.startTime) {
          toast.error(
            `${DAY_NAMES[day]}: la hora de fin debe ser posterior a la de inicio`,
          );
          return;
        }
        blocks.push({
          dayOfWeek: day,
          startTime: block.startTime,
          endTime: block.endTime,
          isActive: dayData.isActive,
        });
      }
    }

    startTransition(async () => {
      try {
        await saveSchedules(psychologistId, blocks);
        toast.success("Horarios guardados correctamente");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Error al guardar los horarios",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAY_ORDER.map((day) => {
          const dayData = days[day];
          return (
            <div
              key={day}
              className={`rounded-lg border border-border p-3 transition-colors ${
                dayData.isActive ? "bg-card" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dayData.isActive}
                    onCheckedChange={(checked) => toggleDay(day, checked)}
                  />
                  <span
                    className={`text-sm font-medium ${
                      dayData.isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {DAY_NAMES[day]}
                  </span>
                </div>
                {dayData.isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => addBlock(day)}
                  >
                    <Plus className="size-3" />
                  </Button>
                )}
              </div>

              {dayData.isActive && dayData.blocks.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {dayData.blocks.map((block, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={block.startTime}
                        onChange={(e) =>
                          updateBlock(day, idx, "startTime", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={block.endTime}
                        onChange={(e) =>
                          updateBlock(day, idx, "endTime", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                      {dayData.blocks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeBlock(day, idx)}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!dayData.isActive && dayData.blocks.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {dayData.blocks
                    .map((b) => `${b.startTime}–${b.endTime}`)
                    .join(", ")}{" "}
                  (inactivo)
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} isLoading={isPending}>
        Guardar horarios
      </Button>
    </div>
  );
}
