"use client";

import { Controller, useFormContext, get } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/form/date-picker-input";

interface FormDatePickerProps {
    name: string;
    label: string;
}

export function FormDatePicker({ name, label }: FormDatePickerProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext();
    const error = get(errors, name);

    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            <Controller
                control={control}
                name={name}
                render={({ field }) => (
                    <DatePickerInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                    />
                )}
            />
            {error && (
                <p className="text-xs text-destructive">
                    {error.message as string}
                </p>
            )}
        </div>
    );
}
