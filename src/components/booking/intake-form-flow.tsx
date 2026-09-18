"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";
import {
    SECTIONS,
    PersonalDataSection,
    ConsultationReasonSection,
    MentalHealthSection,
    MedicalHistorySection,
    SupportNetworkSection,
    TherapyExpectationsSection,
    ConsentSection,
} from "@/components/intake-form/intake-form-sections";
import { submitIntakeForm } from "@/lib/appointments/submit-intake-form";

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

type IntakeFormFlowProps = {
    appointmentId: string;
    /** Relocated from a psychologistSlug prop (Fase 7.2) — both the
     * slug-less /agendar/** flow and the direct /agendar/[slug]/** flow
     * pass their own base path ("/agendar" or "/agendar/{slug}") since
     * this component's only two uses of it are building relative URLs. */
    basePath: string;
    userName: string;
    userEmail: string;
    priorData: Record<string, unknown> | null;
    expiresAt: string | null;
    confirmedTimezone: string | null;
    detectedCountry: string | null;
};

export function IntakeFormFlow({
    appointmentId,
    basePath,
    userName,
    userEmail,
    priorData,
    expiresAt,
    confirmedTimezone,
    detectedCountry,
}: IntakeFormFlowProps) {
    const router = useRouter();
    const [currentSection, setCurrentSection] = useState(0);
    const [isSubmitting, startSubmit] = useTransition();
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

    // Countdown timer
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (!expiresAt) return null;
        return Math.max(
            0,
            Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        );
    });

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft !== null && timeLeft > 0]);

    const isExpired = timeLeft !== null && timeLeft <= 0;

    // Anti-confusion (Fase 7.3): the countdown is visible from the start,
    // not just under 5 minutes — showWarning now only switches its style,
    // never its existence.
    const showWarning = timeLeft !== null && timeLeft > 0 && timeLeft <= 300; // 5 min

    // beforeunload guard (Fase 7.3) — no such listener existed anywhere in
    // this codebase before. Marked true right before the success redirect
    // so that navigation doesn't trigger the browser's own "leave site?"
    // prompt on top of it.
    const submittedRef = useRef(false);
    useEffect(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (submittedRef.current || isExpired) return;
            e.preventDefault();
            e.returnValue = "";
        }
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isExpired]);

    const methods = useForm<IntakeFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(intakeFormSchema) as any,
        defaultValues: {
            fullName: userName ?? "",
            email: userEmail ?? "",
            phone: str(priorData?.phone),
            dateOfBirth: str(priorData?.dateOfBirth),
            gender: str(priorData?.gender),
            maritalStatus: str(priorData?.maritalStatus),
            occupation: str(priorData?.occupation),
            religion: str(priorData?.religion),
            country: str(priorData?.country) || detectedCountry || "CO",
            timezone:
                confirmedTimezone ||
                str(priorData?.timezone) ||
                "America/Bogota",
            consultationReason: "",
            previousTherapy: str(priorData?.previousTherapy),
            previousTherapyDetails: str(priorData?.previousTherapyDetails),
            currentMedication: str(priorData?.currentMedication),
            currentMedicationDetails: str(priorData?.currentMedicationDetails),
            clinicalDataConsent: false,
            medicalHistory: str(priorData?.medicalHistory),
            livingWith: str(priorData?.livingWith),
            emergencyContact: str(priorData?.emergencyContact),
            therapyExpectations: str(priorData?.therapyExpectations),
            informedConsent: false,
            privacyPolicy: false,
        },
        mode: "onTouched",
    });

    const { handleSubmit, trigger, watch } = methods;

    const previousTherapy = watch("previousTherapy");
    const currentMedication = watch("currentMedication");

    async function goNext() {
        const fields = SECTIONS[currentSection]
            .fields as unknown as (keyof IntakeFormData)[];
        const isValid = await trigger(fields);
        if (!isValid) return;

        if (currentSection < SECTIONS.length - 1) {
            setDirection(1);
            setCurrentSection(prev => prev + 1);
        }
    }

    function goBack() {
        if (currentSection > 0) {
            setDirection(-1);
            setCurrentSection(prev => prev - 1);
        }
    }

    function onSubmit(data: IntakeFormData) {
        startSubmit(async () => {
            const result = await submitIntakeForm({
                appointmentId,
                data,
            });

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            submittedRef.current = true;
            toast.success("Formulario enviado correctamente");
            router.push(
                `${basePath}/confirmacion?appointmentId=${appointmentId}`,
            );
        });
    }

    const isLastSection = currentSection === SECTIONS.length - 1;

    return (
        <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16 mt-10 lg:mt-20">
            <BookingStepper currentStep={3} />

            <div className="mb-8 text-center">
                <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                    Inventario de Vida
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Completa la información para tu psicólogo
                </p>
            </div>

            {/* Expiry warning */}
            {isExpired && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                    Tu tiempo para completar el formulario ha expirado. Por
                    favor{" "}
                    <a href={basePath} className="font-medium underline">
                        agenda una nueva sesión
                    </a>
                    .
                </div>
            )}

            {/* Anti-confusion: always visible once expiresAt exists, style
                only changes once time is running low. */}
            {timeLeft !== null && !isExpired && (
                <div
                    className={
                        showWarning
                            ? "mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800"
                            : "mb-4 rounded-md border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground"
                    }
                >
                    Tiempo restante:{" "}
                    <strong>
                        {Math.floor(timeLeft / 60)}:
                        {String(timeLeft % 60).padStart(2, "0")}
                    </strong>
                </div>
            )}

            {/* Section progress */}
            <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Paso {currentSection + 1} de {SECTIONS.length} — tu sesión
                    NO está confirmada hasta terminar
                </span>
                <span className="font-medium text-foreground">
                    {SECTIONS[currentSection].title}
                </span>
            </div>

            {/* Progress bar */}
            <div className="mb-8 h-1 rounded-full bg-muted">
                <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{
                        width: `${((currentSection + 1) / SECTIONS.length) * 100}%`,
                    }}
                    transition={{ duration: 0.4, ease }}
                />
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-lg bg-card p-6 ring-1 ring-border/50 sm:p-8">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentSection}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -40 }}
                                transition={{ duration: 0.3, ease }}
                            >
                                {currentSection === 0 && (
                                    <PersonalDataSection />
                                )}
                                {currentSection === 1 && (
                                    <ConsultationReasonSection />
                                )}
                                {currentSection === 2 && (
                                    <MentalHealthSection
                                        previousTherapy={previousTherapy}
                                        currentMedication={currentMedication}
                                    />
                                )}
                                {currentSection === 3 && (
                                    <MedicalHistorySection />
                                )}
                                {currentSection === 4 && (
                                    <SupportNetworkSection />
                                )}
                                {currentSection === 5 && (
                                    <TherapyExpectationsSection />
                                )}
                                {currentSection === 6 && <ConsentSection />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goBack}
                            disabled={currentSection === 0}
                        >
                            Anterior
                        </Button>

                        {isLastSection ? (
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="bg-accent text-accent-foreground hover:bg-accent/80"
                            >
                                Enviar formulario
                            </Button>
                        ) : (
                            <Button type="button" onClick={goNext}>
                                Siguiente
                            </Button>
                        )}
                    </div>
                </form>
            </FormProvider>
        </section>
    );
}
