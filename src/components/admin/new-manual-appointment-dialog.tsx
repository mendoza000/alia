"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createManualAppointment } from "@/lib/admin/manual-booking-actions";
import { getMonthAvailability } from "@/app/(landing)/psicologos/[slug]/actions";
import type { MonthAvailability } from "@/lib/availability";
import { TIMEZONE_OPTIONS, formatInTimezone } from "@/lib/timezones";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import {
    PAYOUT_TYPES,
    PAYOUT_TYPE_LABELS,
    getPayoutTypeRate,
} from "@/lib/payout-type";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type {
    PayoutType,
    RateKind,
    SessionType,
} from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

type FormValues = {
    psychologistId: string;
    patientName: string;
    patientEmail: string;
    date: string;
    time: string;
    timezone: string;
    notes: string;
    internalNotes: string;
    isException: boolean;
    sessionType: SessionType;
    currency: string;
    amount: string;
    payoutType: PayoutType | "";
};

type PsychologistOption = {
    id: string;
    name: string;
    offeredSessionTypes: SessionType[];
};

export function NewManualAppointmentDialog({
    psychologists,
    rates,
    commissionRates,
    initialPatientName,
    initialPatientEmail,
    triggerLabel = "Nueva cita manual",
}: {
    psychologists: PsychologistOption[];
    rates: { currency: string; kind: RateKind; amount: number }[];
    commissionRates: PayoutSettings;
    /** Locks the patient fields to an existing patient (e.g. from their
     * detail page in /admin/clientes) instead of leaving them free-text. */
    initialPatientName?: string;
    initialPatientEmail?: string;
    triggerLabel?: string;
}) {
    const lockedToPatient = Boolean(initialPatientName && initialPatientEmail);
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availability, setAvailability] = useState<{
        psychologistId: string;
        year: number;
        month: number;
        data: MonthAvailability;
    } | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            psychologistId: "",
            patientName: initialPatientName ?? "",
            patientEmail: initialPatientEmail ?? "",
            date: "",
            time: "",
            timezone: "America/Bogota",
            notes: "",
            internalNotes: "",
            isException: false,
            sessionType: "INDIVIDUAL",
            currency: "",
            amount: "",
            payoutType: "",
        },
    });

    const selectedDate = watch("date");
    const selectedTime = watch("time");
    const selectedTimezone = watch("timezone");
    const isException = watch("isException");
    const selectedPsychologistId = watch("psychologistId");
    const selectedSessionType = watch("sessionType");
    const selectedCurrency = watch("currency");

    const selectedPsychologist = psychologists.find(
        p => p.id === selectedPsychologistId,
    );
    const availableSessionTypes = selectedPsychologist?.offeredSessionTypes ?? [
        "INDIVIDUAL",
    ];
    const availableCurrencies = [...new Set(rates.map(r => r.currency))];

    function prefillAmount(sessionType: SessionType, currency: string) {
        const kind: RateKind =
            sessionType === "COUPLE" ? "COUPLE" : "INDIVIDUAL";
        const rate = rates.find(
            r => r.currency === currency && r.kind === kind,
        );
        setValue("amount", rate ? String(rate.amount) : "");
    }
    const patientLocalTime =
        selectedDate && selectedTime && selectedTimezone
            ? formatInTimezone(selectedDate, selectedTime, selectedTimezone)
            : null;
    const timezoneLabel = TIMEZONE_OPTIONS.find(
        tz => tz.value === selectedTimezone,
    )?.label;

    async function loadAvailability(psychologistId: string) {
        setAvailability(null);
        setLoadingAvailability(true);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const data = await getMonthAvailability(psychologistId, year, month);
        setAvailability({ psychologistId, year, month, data });
        setLoadingAvailability(false);
    }

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const parsedAmount = Number(values.amount);
        const result = await createManualAppointment({
            psychologistId: values.psychologistId,
            patientName: values.patientName,
            patientEmail: values.patientEmail,
            date: values.date,
            time: values.time,
            timezone: values.timezone,
            notes: values.notes || undefined,
            internalNotes: values.internalNotes || undefined,
            isException: values.isException,
            sessionType: values.sessionType,
            agreedAmount: Number.isFinite(parsedAmount)
                ? parsedAmount
                : undefined,
            agreedCurrency: values.currency || undefined,
            agreedPayoutType: values.payoutType || undefined,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        if (result.warning) {
            toast.warning(result.warning);
        }
        toast.success("Cita creada y confirmada");
        reset();
        setAvailability(null);
        setOpen(false);
        router.refresh();
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            reset();
            setAvailability(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button className="gap-2" />}>
                <PlusIcon className="size-4" />
                {triggerLabel}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Agendar cita manualmente</DialogTitle>
                    <DialogDescription>
                        Crea y confirma una cita directamente, sin pasar por el
                        flujo de pago o formulario. Útil para pacientes con
                        problemas durante el agendamiento automático.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Psicólogo</Label>
                        <Controller
                            control={control}
                            name="psychologistId"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select
                                    items={psychologists.map(p => ({
                                        value: p.id,
                                        label: p.name,
                                    }))}
                                    value={field.value}
                                    onValueChange={value => {
                                        field.onChange(value);
                                        setValue("date", "");
                                        setValue("time", "");
                                        const next = psychologists.find(
                                            p => p.id === value,
                                        );
                                        if (
                                            next &&
                                            !next.offeredSessionTypes.includes(
                                                "COUPLE",
                                            )
                                        ) {
                                            setValue(
                                                "sessionType",
                                                "INDIVIDUAL",
                                            );
                                        }
                                        if (value) loadAvailability(value);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona un psicólogo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {psychologists.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.psychologistId && (
                            <p className="text-xs text-destructive">
                                Selecciona un psicólogo
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label>Modalidad</Label>
                            <Controller
                                control={control}
                                name="sessionType"
                                render={({ field }) => (
                                    <Select
                                        items={[
                                            {
                                                value: "INDIVIDUAL",
                                                label: "Individual",
                                            },
                                            {
                                                value: "COUPLE",
                                                label: "Pareja",
                                            },
                                        ]}
                                        value={field.value}
                                        onValueChange={value => {
                                            if (!value) return;
                                            field.onChange(value);
                                            if (selectedCurrency) {
                                                prefillAmount(
                                                    value as SessionType,
                                                    selectedCurrency,
                                                );
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INDIVIDUAL">
                                                Individual
                                            </SelectItem>
                                            <SelectItem
                                                value="COUPLE"
                                                disabled={
                                                    !availableSessionTypes.includes(
                                                        "COUPLE",
                                                    )
                                                }
                                            >
                                                Pareja
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Moneda</Label>
                            <Controller
                                control={control}
                                name="currency"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        items={availableCurrencies.map(c => ({
                                            value: c,
                                            label: c,
                                        }))}
                                        value={field.value}
                                        onValueChange={value => {
                                            if (!value) return;
                                            field.onChange(value);
                                            prefillAmount(
                                                selectedSessionType,
                                                value,
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona una moneda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCurrencies.map(c => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.currency && (
                                <p className="text-xs text-destructive">
                                    Obligatorio
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="amount">Monto</Label>
                            <Input
                                id="amount"
                                type="number"
                                min={1}
                                {...register("amount", { required: true })}
                            />
                            {errors.amount && (
                                <p className="text-xs text-destructive">
                                    Obligatorio
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Comisión</Label>
                            <Controller
                                control={control}
                                name="payoutType"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        items={PAYOUT_TYPES.map(t => ({
                                            value: t,
                                            label: `${PAYOUT_TYPE_LABELS[t]} (${getPayoutTypeRate(commissionRates, t)}%)`,
                                        }))}
                                        value={field.value || undefined}
                                        onValueChange={value =>
                                            field.onChange(value ?? "")
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona qué comisión aplicar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYOUT_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>
                                                    {PAYOUT_TYPE_LABELS[t]} (
                                                    {getPayoutTypeRate(
                                                        commissionRates,
                                                        t,
                                                    )}
                                                    %)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.payoutType && (
                                <p className="text-xs text-destructive">
                                    Obligatorio
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
                        <Controller
                            control={control}
                            name="isException"
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={checked => {
                                        field.onChange(checked);
                                        setValue("date", "");
                                        setValue("time", "");
                                    }}
                                />
                            )}
                        />
                        <div className="grid gap-0.5">
                            <Label>¿Es una excepción?</Label>
                            <p className="text-xs text-muted-foreground">
                                Permite agendar fuera de horario, en fechas
                                pasadas, o si el horario está ocupado. Quedará
                                marcada como excepción.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="patientName">
                                Nombre del paciente
                            </Label>
                            <Input
                                id="patientName"
                                readOnly={lockedToPatient}
                                {...register("patientName", { required: true })}
                            />
                            {errors.patientName && (
                                <p className="text-xs text-destructive">
                                    Obligatorio
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="patientEmail">
                                Correo del paciente
                            </Label>
                            <Input
                                id="patientEmail"
                                type="email"
                                readOnly={lockedToPatient}
                                {...register("patientEmail", {
                                    required: true,
                                })}
                            />
                            {errors.patientEmail && (
                                <p className="text-xs text-destructive">
                                    Obligatorio
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Zona horaria del paciente</Label>
                        <Controller
                            control={control}
                            name="timezone"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select
                                    items={TIMEZONE_OPTIONS}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecciona una zona horaria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONE_OPTIONS.map(tz => (
                                            <SelectItem
                                                key={tz.value}
                                                value={tz.value}
                                            >
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se usa para mostrarle al paciente la hora de su cita
                            en el correo de confirmación.
                        </p>
                    </div>

                    {isException ? (
                        <div className="grid gap-1.5">
                            <Label>Fecha y hora (excepción)</Label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    type="date"
                                    {...register("date", { required: true })}
                                />
                                <Input
                                    type="time"
                                    {...register("time", { required: true })}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <input
                                type="hidden"
                                {...register("date", { required: true })}
                            />
                            <input
                                type="hidden"
                                {...register("time", { required: true })}
                            />
                        </>
                    )}

                    <div className="grid gap-1.5">
                        {!isException && <Label>Disponibilidad</Label>}
                        {isException ? null : !watch("psychologistId") ? (
                            <p className="text-sm text-muted-foreground">
                                Selecciona un psicólogo para ver sus horarios
                                disponibles.
                            </p>
                        ) : loadingAvailability ||
                          availability?.psychologistId !==
                              watch("psychologistId") ? (
                            <p className="text-sm text-muted-foreground">
                                Cargando disponibilidad...
                            </p>
                        ) : (
                            <AvailabilityCalendar
                                key={availability.psychologistId}
                                fetchMonth={(y, m) =>
                                    getMonthAvailability(
                                        availability.psychologistId,
                                        y,
                                        m,
                                    )
                                }
                                initialAvailability={availability.data}
                                initialYear={availability.year}
                                initialMonth={availability.month}
                                onSlotSelect={(date, time) => {
                                    setValue("date", date, {
                                        shouldValidate: true,
                                    });
                                    setValue("time", time, {
                                        shouldValidate: true,
                                    });
                                }}
                            />
                        )}
                        {selectedDate && selectedTime && (
                            <p className="text-sm font-medium text-foreground">
                                Horario seleccionado:{" "}
                                {format(
                                    new Date(`${selectedDate}T12:00:00`),
                                    "EEEE d 'de' MMMM",
                                    { locale: es },
                                )}{" "}
                                — {selectedTime}
                            </p>
                        )}
                        {patientLocalTime && (
                            <p className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium">
                                Para el paciente ({timezoneLabel}):{" "}
                                {patientLocalTime}
                            </p>
                        )}
                        {(errors.date || errors.time) && (
                            <p className="text-xs text-destructive">
                                Selecciona un horario disponible
                            </p>
                        )}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea id="notes" rows={3} {...register("notes")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="internalNotes">
                            Nota interna (solo para el equipo, el paciente no la
                            ve)
                        </Label>
                        <Textarea
                            id="internalNotes"
                            rows={3}
                            {...register("internalNotes")}
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose
                            render={<Button type="button" variant="outline" />}
                        >
                            Cancelar
                        </DialogClose>
                        <Button type="submit" isLoading={isSubmitting}>
                            Crear y confirmar cita
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
