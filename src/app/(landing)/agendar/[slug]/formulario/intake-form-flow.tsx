"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ease } from "@/lib/motion";
import {
    intakeFormSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";
import { BookingStepper } from "@/components/booking/booking-stepper";
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormRadioGroup,
    FormCheckbox,
} from "@/components/form/form-fields";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { Button } from "@/components/ui/button";
import { submitIntakeForm } from "./actions";

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

const SECTIONS = [
    {
        title: "Datos personales",
        fields: [
            "fullName",
            "email",
            "phone",
            "dateOfBirth",
            "gender",
            "maritalStatus",
            "occupation",
        ],
    },
    { title: "Motivo de consulta", fields: ["consultationReason"] },
    {
        title: "Historial de salud mental",
        fields: [
            "previousTherapy",
            "previousTherapyDetails",
            "currentMedication",
            "currentMedicationDetails",
        ],
    },
    { title: "Historial médico", fields: ["medicalHistory"] },
    { title: "Red de apoyo", fields: ["livingWith", "supportNetwork"] },
    { title: "Expectativas de la terapia", fields: ["therapyExpectations"] },
    {
        title: "Consentimiento informado",
        fields: ["informedConsent", "privacyPolicy"],
    },
] as const;

type IntakeFormFlowProps = {
    appointmentId: string;
    psychologistSlug: string;
    userName: string;
    userEmail: string;
    priorData: Record<string, unknown> | null;
    expiresAt: string | null;
};

export function IntakeFormFlow({
    appointmentId,
    psychologistSlug,
    userName,
    userEmail,
    priorData,
    expiresAt,
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
    const showWarning = timeLeft !== null && timeLeft > 0 && timeLeft <= 300; // 5 min

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
            consultationReason: "",
            previousTherapy: str(priorData?.previousTherapy),
            previousTherapyDetails: str(priorData?.previousTherapyDetails),
            currentMedication: str(priorData?.currentMedication),
            currentMedicationDetails: str(priorData?.currentMedicationDetails),
            medicalHistory: str(priorData?.medicalHistory),
            livingWith: str(priorData?.livingWith),
            supportNetwork: str(priorData?.supportNetwork),
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

            toast.success("Formulario enviado correctamente");
            router.push(
                `/agendar/${psychologistSlug}/pago?appointmentId=${appointmentId}`,
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
                    <a
                        href={`/agendar/${psychologistSlug}`}
                        className="font-medium underline"
                    >
                        agenda una nueva cita
                    </a>
                    .
                </div>
            )}
            {showWarning && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
                    Tiempo restante:{" "}
                    <strong>
                        {Math.floor(timeLeft! / 60)}:
                        {String(timeLeft! % 60).padStart(2, "0")}
                    </strong>
                </div>
            )}

            {/* Section progress */}
            <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Paso {currentSection + 1} de {SECTIONS.length}
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

// --- Section Components ---

function PersonalDataSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Datos personales
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <FormInput name="fullName" label="Nombre completo" />
                </div>
                <FormInput
                    name="email"
                    label="Correo electrónico"
                    type="email"
                />
                <FormInput name="phone" label="Teléfono" type="tel" />
                <FormDatePicker
                    name="dateOfBirth"
                    label="Fecha de nacimiento"
                />
                <FormSelect
                    name="gender"
                    label="Género"
                    placeholder="Selecciona..."
                    options={[
                        { value: "Masculino", label: "Masculino" },
                        { value: "Femenino", label: "Femenino" },
                        { value: "No binario", label: "No binario" },
                        {
                            value: "Prefiero no decir",
                            label: "Prefiero no decir",
                        },
                    ]}
                />
                <FormSelect
                    name="maritalStatus"
                    label="Estado civil"
                    placeholder="Selecciona..."
                    options={[
                        { value: "Soltero/a", label: "Soltero/a" },
                        { value: "Casado/a", label: "Casado/a" },
                        { value: "Unión libre", label: "Unión libre" },
                        { value: "Divorciado/a", label: "Divorciado/a" },
                        { value: "Viudo/a", label: "Viudo/a" },
                    ]}
                />
                <div className="sm:col-span-2">
                    <FormInput name="occupation" label="Ocupación" />
                </div>
            </div>
        </div>
    );
}

function ConsultationReasonSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Motivo de consulta
            </h2>
            <FormTextarea
                name="consultationReason"
                label="¿Cuál es el motivo principal por el que buscas atención psicológica?"
                rows={5}
                placeholder="Describe con tus propias palabras..."
            />
        </div>
    );
}

function MentalHealthSection({
    previousTherapy,
    currentMedication,
}: {
    previousTherapy: string | undefined;
    currentMedication: string | undefined;
}) {
    return (
        <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold">
                Historial de salud mental
            </h2>
            <FormRadioGroup
                name="previousTherapy"
                label="¿Has recibido tratamiento psicológico o psiquiátrico anteriormente?"
                options={[
                    { value: "Sí", label: "Sí" },
                    { value: "No", label: "No" },
                ]}
            />
            {previousTherapy === "Sí" && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease }}
                >
                    <FormTextarea
                        name="previousTherapyDetails"
                        label="Describe brevemente los tratamientos anteriores"
                        rows={3}
                    />
                </motion.div>
            )}
            <FormRadioGroup
                name="currentMedication"
                label="¿Tomas alguna medicación actualmente?"
                options={[
                    { value: "Sí", label: "Sí" },
                    { value: "No", label: "No" },
                ]}
            />
            {currentMedication === "Sí" && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease }}
                >
                    <FormTextarea
                        name="currentMedicationDetails"
                        label="¿Qué medicación tomas actualmente?"
                        rows={3}
                    />
                </motion.div>
            )}
        </div>
    );
}

function MedicalHistorySection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Historial médico relevante
            </h2>
            <FormTextarea
                name="medicalHistory"
                label="¿Padeces alguna enfermedad o condición médica relevante?"
                rows={4}
                placeholder="Enfermedades crónicas, alergias, tratamientos..."
            />
        </div>
    );
}

function SupportNetworkSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Red de apoyo / situación familiar
            </h2>
            <FormInput
                name="livingWith"
                label="¿Con quién vives actualmente?"
            />
            <FormTextarea
                name="supportNetwork"
                label="¿Cuentas con una red de apoyo? Describe brevemente."
                rows={3}
                placeholder="Familia, amigos, pareja..."
            />
        </div>
    );
}

function TherapyExpectationsSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Expectativas de la terapia
            </h2>
            <FormTextarea
                name="therapyExpectations"
                label="¿Qué esperas lograr con la terapia?"
                rows={5}
                placeholder="Tus metas, lo que te gustaría mejorar..."
            />
        </div>
    );
}

function ConsentSection() {
    return (
        <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold">
                Consentimiento informado
            </h2>
            <p className="text-sm text-muted-foreground">
                Para continuar, es necesario que aceptes los siguientes
                términos:
            </p>
            <FormCheckbox
                name="informedConsent"
                label="Acepto que la información proporcionada es verídica y autorizo su uso confidencial con fines terapéuticos, de acuerdo con la Ley 1581 de 2012 (Habeas Data)."
            />
            <FormCheckbox
                name="privacyPolicy"
                label="He leído y acepto la Política de Privacidad."
            />
        </div>
    );
}
