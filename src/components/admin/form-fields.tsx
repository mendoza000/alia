"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const error = errors[name];

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} className="h-9" {...register(name)} {...props} />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}

interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  name: string;
  label: string;
}

export function FormTextarea({ name, label, ...props }: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} {...register(name)} {...props} />
      {error && (
        <p className="text-xs text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}

interface FormSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  options: { value: string | number; label: string }[];
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
  const error = errors[name];

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(val) => field.onChange(val)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && (
        <p className="text-xs text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}

interface FormSwitchProps {
  name: string;
  label: string;
  description?: string;
}

export function FormSwitch({ name, label, description }: FormSwitchProps) {
  const { control } = useFormContext();

  return (
    <div className="grid gap-1.5">
      {label && <Label>{label}</Label>}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="flex h-9 items-center gap-2">
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            {description && (
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      />
    </div>
  );
}
