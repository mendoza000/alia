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
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ease } from "@/lib/motion";
import type { Psychologist, Schedule } from "@/generated/prisma/client";
import type { MonthAvailability } from "@/lib/availability";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { createAppointment } from "./actions";

const currencyFormat = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Step = "calendar" | "auth" | "summary";

type BookingFlowProps = {
    psychologist: Psychologist & { schedules: Schedule[] };
    initialAvailability: MonthAvailability;
    initialYear: number;
    initialMonth: number;
    preselectedDate: string | null;
    preselectedTime: string | null;
};

export function BookingFlow({
    psychologist,
    initialAvailability,
    initialYear,
    initialMonth,
    preselectedDate,
    preselectedTime,
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

    const hasSelection = selectedDate && selectedTime;
    const isAuthenticated = !!session?.user;

    const currentStep: Step = useMemo(() => {
        if (!hasSelection) return "calendar";
        if (isSessionPending) return "auth";
        if (!isAuthenticated) return "auth";
        return "summary";
    }, [hasSelection, isSessionPending, isAuthenticated]);

    // Auto-advance from auth to summary when session loads
    const [step, setStep] = useState<Step>(currentStep);
    useEffect(() => {
        setStep(currentStep);
    }, [currentStep]);

    const handleSlotSelect = useCallback((date: string, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
    }, []);

    const handleChangeSlot = useCallback(() => {
        setStep("calendar");
        setSelectedDate(null);
        setSelectedTime(null);
    }, []);

    const handleCreateAppointment = useCallback(() => {
        if (!selectedDate || !selectedTime) return;

        startCreating(async () => {
            const result = await createAppointment({
                psychologistId: psychologist.id,
                dateTime: `${selectedDate}T${selectedTime}`,
            });

            if (!result.success) {
                toast.error(result.error);
                handleChangeSlot();
                return;
            }

            router.push(
                `/agendar/${psychologist.slug}/formulario?appointmentId=${result.appointmentId}`,
            );
        });
    }, [
        selectedDate,
        selectedTime,
        psychologist.id,
        psychologist.slug,
        router,
        handleChangeSlot,
    ]);

    const callbackURL =
        typeof window !== "undefined"
            ? window.location.href
            : `/agendar/${psychologist.slug}${selectedDate && selectedTime ? `?date=${selectedDate}&time=${selectedTime}` : ""}`;

    return (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
            <BookingStepper currentStep={2} />

            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Agendar cita
                </h1>
                <p className="mt-2 text-muted-foreground">
                    con {psychologist.name}
                </p>
            </div>

            <AnimatePresence mode="wait">
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
                            callbackURL={callbackURL}
                            isSessionPending={isSessionPending}
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
                            selectedDate={selectedDate!}
                            selectedTime={selectedTime!}
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
}: {
    psychologist: Psychologist & { schedules: Schedule[] };
    initialAvailability: MonthAvailability;
    initialYear: number;
    initialMonth: number;
    onSlotSelect: (date: string, time: string) => void;
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
            />
        </div>
    );
}

// ---------- Auth Step ----------

function AuthStep({
    psychologistName,
    selectedDate,
    selectedTime,
    callbackURL,
    isSessionPending,
    onChangeSlot,
}: {
    psychologistName: string;
    selectedDate: string;
    selectedTime: string;
    callbackURL: string;
    isSessionPending: boolean;
    onChangeSlot: () => void;
}) {
    const formattedDate = format(
        new Date(`${selectedDate}T12:00:00`),
        "EEEE d 'de' MMMM, yyyy",
        { locale: es },
    );

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                {/* Appointment preview */}
                <div className="mb-6 rounded-md bg-secondary/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Tu cita</p>
                    <p className="mt-1 font-medium">{psychologistName}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                        {formattedDate} — {selectedTime}
                    </p>
                </div>

                {isSessionPending ? (
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4 mx-auto" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="mb-4 text-sm text-muted-foreground">
                            Inicia sesión para continuar con tu agendamiento
                        </p>
                        <GoogleSignInButton callbackURL={callbackURL} />
                    </div>
                )}

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

// ---------- Summary Step ----------

function SummaryStep({
    psychologist,
    selectedDate,
    selectedTime,
    session,
    isCreating,
    onChangeSlot,
    onConfirm,
}: {
    psychologist: Psychologist & { schedules: Schedule[] };
    selectedDate: string;
    selectedTime: string;
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

    return (
        <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                <h2 className="mb-5 text-center font-heading text-xl font-bold">
                    Resumen de tu cita
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
                        <span className="font-medium">{selectedTime}</span>
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
                            {currencyFormat.format(psychologist.sessionRate)}
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
