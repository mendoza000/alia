"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ease } from "@/lib/motion";
import { formatCurrencyAmount } from "@/lib/currency";
import { trackInitiateCheckout } from "@/lib/analytics/events";
import type { Psychologist, Schedule } from "@/generated/prisma/client";
import type { MonthAvailability } from "@/lib/availability";
import { CARACAS_TZ } from "@/lib/availability";
import {
    TIMEZONE_OPTIONS,
    detectBrowserTimezone,
    formatInTimezone,
    matchTimezoneOption,
} from "@/lib/timezones";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { createAppointment } from "./actions";

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Step = "timezone" | "calendar" | "auth" | "summary";

type BookingFlowProps = {
    psychologist: Psychologist & { schedules: Schedule[] };
    globalRate: { amount: number; currency: string } | null;
    initialAvailability: MonthAvailability;
    initialYear: number;
    initialMonth: number;
    preselectedDate: string | null;
    preselectedTime: string | null;
    preselectedTimezone: string | null;
};

export function BookingFlow({
    psychologist,
    globalRate,
    initialAvailability,
    initialYear,
    initialMonth,
    preselectedDate,
    preselectedTime,
    preselectedTimezone,
}: BookingFlowProps) {
    const router = useRouter();
    const { data: session, isPending: isSessionPending } = useSession();

    const [selectedDate, setSelectedDate] = useState<string | null>(
        preselectedDate,
    );
    const [selectedTime, setSelectedTime] = useState<string | null>(
        preselectedTime,
    );
    const [isCreating, startCreating] = useTransition();
    // Starts at CARACAS_TZ so server and client render the same markup on
    // first paint — Intl.DateTimeFormat().resolvedOptions().timeZone reads
    // the server's own timezone during SSR, not the browser's, which would
    // otherwise cause a hydration mismatch. The real value is filled in
    // client-side right after mount.
    const [detectedTimezone, setDetectedTimezone] = useState(CARACAS_TZ);
    const [confirmedTimezone, setConfirmedTimezone] = useState<string | null>(
        preselectedTimezone,
    );

    useEffect(() => {
        setDetectedTimezone(detectBrowserTimezone());
    }, []);

    const hasSelection = selectedDate && selectedTime;
    const isAuthenticated = !!session?.user;

    const step: Step = useMemo(() => {
        if (!confirmedTimezone) return "timezone";
        if (!hasSelection || isSessionPending) return "calendar";
        if (!isAuthenticated) return "auth";
        return "summary";
    }, [confirmedTimezone, hasSelection, isSessionPending, isAuthenticated]);

    const handleSlotSelect = useCallback((date: string, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
    }, []);

    const handleChangeSlot = useCallback(() => {
        setSelectedDate(null);
        setSelectedTime(null);
    }, []);

    const handleCreateAppointment = useCallback(() => {
        if (!selectedDate || !selectedTime) return;

        startCreating(async () => {
            const result = await createAppointment({
                psychologistId: psychologist.id,
                dateTime: `${selectedDate}T${selectedTime}`,
                timezone: confirmedTimezone ?? CARACAS_TZ,
            });

            if (!result.success) {
                toast.error(result.error);
                handleChangeSlot();
                return;
            }

            trackInitiateCheckout(
                globalRate
                    ? {
                          value: globalRate.amount,
                          currency: globalRate.currency,
                      }
                    : undefined,
            );

            const path = result.skipForm
                ? `/agendar/${psychologist.slug}/confirmacion?appointmentId=${result.appointmentId}`
                : `/agendar/${psychologist.slug}/formulario?appointmentId=${result.appointmentId}&timezone=${encodeURIComponent(confirmedTimezone ?? CARACAS_TZ)}`;
            router.push(path);
        });
    }, [
        selectedDate,
        selectedTime,
        psychologist.id,
        psychologist.slug,
        globalRate,
        router,
        handleChangeSlot,
        confirmedTimezone,
    ]);

    const callbackURL = `/agendar/${psychologist.slug}${
        selectedDate && selectedTime
            ? `?date=${selectedDate}&time=${selectedTime}${
                  confirmedTimezone
                      ? `&tz=${encodeURIComponent(confirmedTimezone)}`
                      : ""
              }`
            : ""
    }`;

    return (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
            <BookingStepper currentStep={2} />

            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Agendar sesión
                </h1>
                <p className="mt-2 text-muted-foreground">
                    con {psychologist.name}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === "timezone" && (
                    <motion.div
                        key="timezone"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.35, ease }}
                    >
                        <TimezoneConfirmStep
                            detectedTimezone={detectedTimezone}
                            onConfirm={setConfirmedTimezone}
                        />
                    </motion.div>
                )}

                {step === "calendar" && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.35, ease }}
                    >
                        <CalendarStep
                            psychologist={psychologist}
                            initialAvailability={initialAvailability}
                            initialYear={initialYear}
                            initialMonth={initialMonth}
                            onSlotSelect={handleSlotSelect}
                            patientTimezone={confirmedTimezone ?? CARACAS_TZ}
                        />
                    </motion.div>
                )}

                {step === "auth" && (
                    <motion.div
                        key="auth"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.35, ease }}
                    >
                        <AuthStep
                            psychologistName={psychologist.name}
                            selectedDate={selectedDate!}
                            selectedTime={selectedTime!}
                            patientTimezone={confirmedTimezone ?? CARACAS_TZ}
                            callbackURL={callbackURL}
                            onChangeSlot={handleChangeSlot}
                        />
                    </motion.div>
                )}

                {step === "summary" && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.35, ease }}
                    >
                        <SummaryStep
                            psychologist={psychologist}
                            globalRate={globalRate}
                            selectedDate={selectedDate!}
                            selectedTime={selectedTime!}
                            patientTimezone={confirmedTimezone!}
                            session={session!}
                            isCreating={isCreating}
                            onChangeSlot={handleChangeSlot}
                            onConfirm={handleCreateAppointment}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// ---------- Calendar Step ----------

function CalendarStep({
    psychologist,
    initialAvailability,
    initialYear,
    initialMonth,
    onSlotSelect,
    patientTimezone,
}: {
    psychologist: Psychologist & { schedules: Schedule[] };
    initialAvailability: MonthAvailability;
    initialYear: number;
    initialMonth: number;
    onSlotSelect: (date: string, time: string) => void;
    patientTimezone: string;
}) {
    return (
        <div>
            <p className="mb-4 text-center text-sm text-muted-foreground">
                Selecciona el día y horario que prefieras
            </p>
            <AvailabilityCalendar
                psychologistId={psychologist.id}
                psychologistSlug={psychologist.slug}
                schedules={psychologist.schedules}
                sessionDuration={psychologist.sessionDuration}
                initialAvailability={initialAvailability}
                initialYear={initialYear}
                initialMonth={initialMonth}
                onSlotSelect={onSlotSelect}
                patientTimezone={patientTimezone}
            />
        </div>
    );
}

// ---------- Auth Step ----------

function AuthStep({
    psychologistName,
    selectedDate,
    selectedTime,
    patientTimezone,
    callbackURL,
    onChangeSlot,
}: {
    psychologistName: string;
    selectedDate: string;
    selectedTime: string;
    patientTimezone: string;
    callbackURL: string;
    onChangeSlot: () => void;
}) {
    const formattedDate = format(
        new Date(`${selectedDate}T12:00:00`),
        "EEEE d 'de' MMMM, yyyy",
        { locale: es },
    );
    const displayTime = formatInTimezone(
        selectedDate,
        selectedTime,
        patientTimezone,
    );

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                {/* Appointment preview */}
                <div className="mb-6 rounded-md bg-secondary/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Tu sesión</p>
                    <p className="mt-1 font-medium">{psychologistName}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                        {formattedDate} — {displayTime}
                    </p>
                </div>

                <div className="text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                        Inicia sesión para continuar con tu agendamiento
                    </p>
                    <GoogleSignInButton callbackURL={callbackURL} />
                </div>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    o continúa con correo
                    <div className="h-px flex-1 bg-border" />
                </div>

                <EmailSignInForm callbackURL={callbackURL} />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href={`/registro?callbackURL=${encodeURIComponent(callbackURL)}`}
                        className="font-medium underline-offset-2 hover:underline"
                    >
                        Crea una
                    </Link>
                </p>

                <button
                    type="button"
                    onClick={onChangeSlot}
                    className="mt-4 block w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                    Cambiar horario
                </button>
            </div>
        </div>
    );
}

// ---------- Timezone Confirm Step ----------

function TimezoneConfirmStep({
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

// ---------- Summary Step ----------

function SummaryStep({
    psychologist,
    globalRate,
    selectedDate,
    selectedTime,
    patientTimezone,
    session,
    isCreating,
    onChangeSlot,
    onConfirm,
}: {
    psychologist: Psychologist & { schedules: Schedule[] };
    globalRate: { amount: number; currency: string } | null;
    selectedDate: string;
    selectedTime: string;
    patientTimezone: string;
    session: {
        user: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
        };
    };
    isCreating: boolean;
    onChangeSlot: () => void;
    onConfirm: () => void;
}) {
    const formattedDate = format(
        new Date(`${selectedDate}T12:00:00`),
        "EEEE d 'de' MMMM, yyyy",
        { locale: es },
    );
    const displayTime = formatInTimezone(
        selectedDate,
        selectedTime,
        patientTimezone,
    );

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                <h2 className="mb-5 text-center font-heading text-xl font-bold">
                    Resumen de tu sesión
                </h2>

                {/* Psychologist info */}
                <div className="flex items-center gap-4">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {psychologist.photoUrl ? (
                            <Image
                                src={psychologist.photoUrl}
                                alt={psychologist.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="font-heading text-lg text-muted-foreground">
                                    {getInitials(psychologist.name)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold">{psychologist.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {psychologist.specialty}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha</span>
                        <span className="font-medium capitalize">
                            {formattedDate}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Hora</span>
                        <span className="font-medium">{displayTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración</span>
                        <span className="font-medium">
                            {psychologist.sessionDuration} min
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium">
                            {globalRate !== null
                                ? formatCurrencyAmount(
                                      globalRate.amount,
                                      globalRate.currency,
                                  )
                                : "Se coordina con tu psicólogo"}
                        </span>
                    </div>
                </div>

                {/* Authenticated user */}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                    <div className="flex items-center gap-2">
                        {session.user.image ? (
                            <Image
                                src={session.user.image}
                                alt=""
                                width={28}
                                height={28}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                                {getInitials(session.user.name)}
                            </div>
                        )}
                        <span className="text-sm">{session.user.name}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => signOut()}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                        ¿No eres tú?
                    </button>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                    <Button
                        onClick={onConfirm}
                        isLoading={isCreating}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/80"
                        size="lg"
                    >
                        Continuar al formulario
                    </Button>
                    <button
                        type="button"
                        onClick={onChangeSlot}
                        className="block w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                        Cambiar horario
                    </button>
                </div>
            </div>
        </div>
    );
}
