"use client";

import {
    useCallback,
    useEffect,
    useMemo,
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
import type { MonthAvailability } from "@/lib/availability";
import { CARACAS_TZ } from "@/lib/availability";
import { detectBrowserTimezone, formatInTimezone } from "@/lib/timezones";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { TimezoneConfirmStep } from "@/components/booking/timezone-confirm-step";
import { AuthStep } from "@/components/booking/auth-step";
import {
    ModalityPickerStep,
    type ModalityStatus,
} from "@/components/booking/modality-picker-step";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms";
import type { SessionType } from "@/generated/prisma/enums";
import {
    createAutoAssignedAppointment,
    getAggregatedMonthAvailabilityAction,
} from "./actions";

type Step = "modality" | "timezone" | "calendar" | "auth" | "summary";

const MODALITY_LABELS: Record<SessionType, string> = {
    INDIVIDUAL: "Individual",
    COUPLE: "Pareja",
};

const MODALITY_DURATIONS: Record<SessionType, number> = {
    INDIVIDUAL: 60,
    COUPLE: 120,
};

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AgendarBookingFlow({
    individualStatus,
    coupleStatus,
    individualRate,
    coupleRate,
    preselectedSessionType,
    preselectedDate,
    preselectedTime,
    preselectedTimezone,
}: {
    individualStatus: ModalityStatus;
    coupleStatus: ModalityStatus;
    individualRate: { amount: number; currency: string } | null;
    coupleRate: { amount: number; currency: string } | null;
    preselectedSessionType: SessionType | null;
    preselectedDate: string | null;
    preselectedTime: string | null;
    preselectedTimezone: string | null;
}) {
    const router = useRouter();
    const { data: session, isPending: isSessionPending } = useSession();

    const [sessionType, setSessionType] = useState<SessionType | null>(
        preselectedSessionType,
    );
    const [selectedDate, setSelectedDate] = useState<string | null>(
        preselectedDate,
    );
    const [selectedTime, setSelectedTime] = useState<string | null>(
        preselectedTime,
    );
    const [isCreating, startCreating] = useTransition();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [detectedTimezone, setDetectedTimezone] = useState(CARACAS_TZ);
    const [confirmedTimezone, setConfirmedTimezone] = useState<string | null>(
        preselectedTimezone,
    );

    const [monthAvailability, setMonthAvailability] =
        useState<MonthAvailability | null>(null);
    const [availabilityYear, setAvailabilityYear] = useState<number | null>(
        null,
    );
    const [availabilityMonth, setAvailabilityMonth] = useState<number | null>(
        null,
    );

    useEffect(() => {
        setDetectedTimezone(detectBrowserTimezone());
    }, []);

    // Unlike the direct-slug flow, sessionType isn't known server-side until
    // this step runs client-side, so there's no SSR-prefetched first month —
    // fetch it once here, reusing AvailabilityCalendar's own opacity-dimming
    // loading affordance for every subsequent month change.
    useEffect(() => {
        if (!sessionType) return;
        let cancelled = false;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        getAggregatedMonthAvailabilityAction(sessionType, year, month).then(
            data => {
                if (cancelled) return;
                setMonthAvailability(data);
                setAvailabilityYear(year);
                setAvailabilityMonth(month);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [sessionType]);

    const hasSelection = selectedDate && selectedTime;
    const isAuthenticated = !!session?.user;

    const step: Step = useMemo(() => {
        if (!sessionType) return "modality";
        if (!confirmedTimezone) return "timezone";
        if (!hasSelection || isSessionPending) return "calendar";
        if (!isAuthenticated) return "auth";
        return "summary";
    }, [
        sessionType,
        confirmedTimezone,
        hasSelection,
        isSessionPending,
        isAuthenticated,
    ]);

    const handleSelectModality = useCallback((type: SessionType) => {
        setSessionType(type);
    }, []);

    const handleChangeModality = useCallback(() => {
        setSessionType(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setMonthAvailability(null);
    }, []);

    const handleSlotSelect = useCallback((date: string, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
    }, []);

    const handleChangeSlot = useCallback(() => {
        setSelectedDate(null);
        setSelectedTime(null);
    }, []);

    const handleCreateAppointment = useCallback(() => {
        if (!sessionType || !selectedDate || !selectedTime || !termsAccepted) {
            return;
        }

        startCreating(async () => {
            const result = await createAutoAssignedAppointment({
                sessionType,
                dateTime: `${selectedDate}T${selectedTime}`,
                timezone: confirmedTimezone ?? CARACAS_TZ,
                termsVersion: CURRENT_TERMS_VERSION,
            });

            if (!result.success) {
                toast.error(result.error);
                handleChangeSlot();
                return;
            }

            const rate = sessionType === "COUPLE" ? coupleRate : individualRate;
            trackInitiateCheckout(
                rate
                    ? { value: rate.amount, currency: rate.currency }
                    : undefined,
            );

            const path = result.skipForm
                ? `/agendar/confirmacion?appointmentId=${result.appointmentId}`
                : `/agendar/formulario?appointmentId=${result.appointmentId}&timezone=${encodeURIComponent(confirmedTimezone ?? CARACAS_TZ)}`;
            router.push(path);
        });
    }, [
        sessionType,
        selectedDate,
        selectedTime,
        termsAccepted,
        coupleRate,
        individualRate,
        router,
        handleChangeSlot,
        confirmedTimezone,
    ]);

    const callbackURL = `/agendar${
        sessionType && selectedDate && selectedTime
            ? `?type=${sessionType}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(
                  selectedTime,
              )}${
                  confirmedTimezone
                      ? `&tz=${encodeURIComponent(confirmedTimezone)}`
                      : ""
              }`
            : ""
    }`;

    return (
        <AnimatePresence mode="wait">
            {step === "modality" && (
                <motion.div
                    key="modality"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease }}
                >
                    <ModalityPickerStep
                        individualStatus={individualStatus}
                        coupleStatus={coupleStatus}
                        individualRate={individualRate}
                        coupleRate={coupleRate}
                        onSelect={handleSelectModality}
                    />
                </motion.div>
            )}

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

            {step === "calendar" && sessionType && (
                <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease }}
                >
                    <CalendarStep
                        sessionType={sessionType}
                        monthAvailability={monthAvailability}
                        availabilityYear={availabilityYear}
                        availabilityMonth={availabilityMonth}
                        onSlotSelect={handleSlotSelect}
                        onChangeModality={handleChangeModality}
                        patientTimezone={confirmedTimezone ?? CARACAS_TZ}
                    />
                </motion.div>
            )}

            {step === "auth" && sessionType && (
                <motion.div
                    key="auth"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease }}
                >
                    <AuthStep
                        sessionLabel={`Sesión ${MODALITY_LABELS[sessionType]} (${MODALITY_DURATIONS[sessionType]} min)`}
                        selectedDate={selectedDate!}
                        selectedTime={selectedTime!}
                        patientTimezone={confirmedTimezone ?? CARACAS_TZ}
                        callbackURL={callbackURL}
                        onChangeSlot={handleChangeSlot}
                    />
                </motion.div>
            )}

            {step === "summary" && sessionType && (
                <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease }}
                >
                    <AutoAssignSummaryStep
                        sessionType={sessionType}
                        rate={
                            sessionType === "COUPLE"
                                ? coupleRate
                                : individualRate
                        }
                        selectedDate={selectedDate!}
                        selectedTime={selectedTime!}
                        patientTimezone={confirmedTimezone!}
                        session={session!}
                        isCreating={isCreating}
                        termsAccepted={termsAccepted}
                        onTermsAcceptedChange={setTermsAccepted}
                        onChangeSlot={handleChangeSlot}
                        onConfirm={handleCreateAppointment}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ---------- Calendar Step ----------

function CalendarStep({
    sessionType,
    monthAvailability,
    availabilityYear,
    availabilityMonth,
    onSlotSelect,
    onChangeModality,
    patientTimezone,
}: {
    sessionType: SessionType;
    monthAvailability: MonthAvailability | null;
    availabilityYear: number | null;
    availabilityMonth: number | null;
    onSlotSelect: (date: string, time: string) => void;
    onChangeModality: () => void;
    patientTimezone: string;
}) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Selecciona el día y horario que prefieras
                </p>
                <button
                    type="button"
                    onClick={onChangeModality}
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                    Cambiar modalidad
                </button>
            </div>
            {monthAvailability === null ||
            availabilityYear === null ||
            availabilityMonth === null ? (
                <p className="text-center text-sm text-muted-foreground">
                    Cargando disponibilidad...
                </p>
            ) : (
                <AvailabilityCalendar
                    fetchMonth={(y, m) =>
                        getAggregatedMonthAvailabilityAction(sessionType, y, m)
                    }
                    initialAvailability={monthAvailability}
                    initialYear={availabilityYear}
                    initialMonth={availabilityMonth}
                    onSlotSelect={onSlotSelect}
                    patientTimezone={patientTimezone}
                />
            )}
        </div>
    );
}

// ---------- Summary Step (auto-assigned — no psychologist reveal) ----------

function AutoAssignSummaryStep({
    sessionType,
    rate,
    selectedDate,
    selectedTime,
    patientTimezone,
    session,
    isCreating,
    termsAccepted,
    onTermsAcceptedChange,
    onChangeSlot,
    onConfirm,
}: {
    sessionType: SessionType;
    rate: { amount: number; currency: string } | null;
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
    termsAccepted: boolean;
    onTermsAcceptedChange: (accepted: boolean) => void;
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

                {/* Deliberately no photo/name/specialty — the specialist is
                    revealed only after the intake form is submitted. */}
                <div className="rounded-md bg-secondary/50 p-4 text-center">
                    <p className="font-medium">
                        Sesión {MODALITY_LABELS[sessionType]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Tu especialista se asignará al confirmar tu formulario
                    </p>
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
                            {MODALITY_DURATIONS[sessionType]} min
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium">
                            {rate !== null
                                ? formatCurrencyAmount(
                                      rate.amount,
                                      rate.currency,
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

                {/* Terms acceptance */}
                <div className="mt-5 flex items-start gap-2 border-t border-border pt-5">
                    <Checkbox
                        id="terms-accepted"
                        checked={termsAccepted}
                        onCheckedChange={checked =>
                            onTermsAcceptedChange(checked === true)
                        }
                    />
                    <label
                        htmlFor="terms-accepted"
                        className="text-sm text-muted-foreground"
                    >
                        Acepto los{" "}
                        <Link
                            href="/terminos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline"
                        >
                            Términos y Condiciones
                        </Link>{" "}
                        (versión {CURRENT_TERMS_VERSION}) de ALIA.
                    </label>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                    <Button
                        onClick={onConfirm}
                        isLoading={isCreating}
                        disabled={!termsAccepted}
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
