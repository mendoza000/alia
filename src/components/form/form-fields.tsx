"use client";

import {
    Controller,
    useFormContext,
    type FieldValues,
    type Path,
} from "react-hook-form";
import { get } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- FormInput ---

interface FormInputProps extends React.ComponentProps<typeof Input> {
    name: string;
    label: string;
    description?: string;
}

export function FormInput({
    name,
    label,
    description,
    ...props
}: FormInputProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext();
    const error = get(errors, name);

    return (
        <div className="grid gap-1.5">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} {...register(name)} {...props} />
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
                <p className="text-xs text-destructive">
                    {error.message as string}
                </p>
            )}
        </div>
    );
}

// --- FormTextarea ---

interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
    name: string;
    label: string;
    description?: string;
}

export function FormTextarea({
    name,
    label,
    description,
    ...props
}: FormTextareaProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext();
    const error = get(errors, name);

    return (
        <div className="grid gap-1.5">
            <Label htmlFor={name}>{label}</Label>
            <Textarea id={name} {...register(name)} {...props} />
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
                <p className="text-xs text-destructive">
                    {error.message as string}
                </p>
            )}
        </div>
    );
}

// --- FormSelect ---

interface FormSelectProps {
    name: string;
    label: string;
    placeholder?: string;
    options: { value: string; label: string }[];
}

export function FormSelect({
    name,
    label,
    placeholder,
    options,
}: FormSelectProps) {
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
                    <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

// --- FormRadioGroup ---

interface FormRadioGroupProps {
    name: string;
    label: string;
    options: { value: string; label: string }[];
    description?: string;
}

export function FormRadioGroup({
    name,
    label,
    options,
    description,
}: FormRadioGroupProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext();
    const error = get(errors, name);

    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <Controller
                control={control}
                name={name}
                render={({ field }) => (
                    <RadioGroup
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                    >
                        {options.map(opt => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <RadioGroupItem value={opt.value} />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </RadioGroup>
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

// --- FormCheckbox ---

interface FormCheckboxProps {
    name: string;
    label: string;
}

export function FormCheckbox({ name, label }: FormCheckboxProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext();
    const error = get(errors, name);

    return (
        <div className="grid gap-1.5">
            <Controller
                control={control}
                name={name}
                render={({ field }) => (
                    <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                        />
                        <span className="text-sm leading-relaxed">{label}</span>
                    </label>
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
