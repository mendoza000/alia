"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ease } from "@/lib/motion";
import {
    intakeFormAdminUpdateSchema,
    type IntakeFormData,
} from "@/lib/validators/intake-form";
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
import { Button } from "@/components/ui/button";
import { updateMyIntakeForm } from "./actions";

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

/**
 * Edit-mode counterpart to the booking flow's IntakeFormFlow — same section
 * components and field-by-field stepper, but no expiry countdown, no
 * booking BookingStepper, and it submits via updateMyIntakeForm instead of
 * submitIntakeForm, redirecting to /mi-cuenta on success.
 */
export function EditIntakeFormFlow({
    priorData,
}: {
    priorData: Record<string, unknown>;
}) {
    const router = useRouter();
    const [currentSection, setCurrentSection] = useState(0);
    const [isSubmitting, startSubmit] = useTransition();
    const [direction, setDirection] = useState(1);

    const methods = useForm<IntakeFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(intakeFormAdminUpdateSchema) as any,
        defaultValues: {
            fullName: str(priorData.fullName),
            email: str(priorData.email),
            phone: str(priorData.phone),
            dateOfBirth: str(priorData.dateOfBirth),
            gender: str(priorData.gender),
            maritalStatus: str(priorData.maritalStatus),
            occupation: str(priorData.occupation),
            religion: str(priorData.religion),
            country: str(priorData.country) || "CO",
            timezone: str(priorData.timezone) || "America/Bogota",
            consultationReason: str(priorData.consultationReason),
            previousTherapy: str(priorData.previousTherapy),
            previousTherapyDetails: str(priorData.previousTherapyDetails),
            currentMedication: str(priorData.currentMedication),
            currentMedicationDetails: str(priorData.currentMedicationDetails),
            clinicalDataConsent: Boolean(priorData.clinicalDataConsent),
            medicalHistory: str(priorData.medicalHistory),
            livingWith: str(priorData.livingWith),
            emergencyContact: str(priorData.emergencyContact),
            therapyExpectations: str(priorData.therapyExpectations),
            informedConsent: Boolean(priorData.informedConsent),
            privacyPolicy: Boolean(priorData.privacyPolicy),
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
            const result = await updateMyIntakeForm(data);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success("Formulario actualizado");
            router.push("/mi-cuenta");
        });
    }

    const isLastSection = currentSection === SECTIONS.length - 1;

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Paso {currentSection + 1} de {SECTIONS.length}
                    </span>
                    <span className="font-medium text-foreground">
                        {SECTIONS[currentSection].title}
                    </span>
                </div>

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
                            {currentSection === 0 && <PersonalDataSection />}
                            {currentSection === 1 && (
                                <ConsultationReasonSection />
                            )}
                            {currentSection === 2 && (
                                <MentalHealthSection
                                    previousTherapy={previousTherapy}
                                    currentMedication={currentMedication}
                                />
                            )}
                            {currentSection === 3 && <MedicalHistorySection />}
                            {currentSection === 4 && <SupportNetworkSection />}
                            {currentSection === 5 && (
                                <TherapyExpectationsSection />
                            )}
                            {currentSection === 6 && <ConsentSection />}
                        </motion.div>
                    </AnimatePresence>
                </div>

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
                        <Button type="submit" isLoading={isSubmitting}>
                            Guardar cambios
                        </Button>
                    ) : (
                        <Button type="button" onClick={goNext}>
                            Siguiente
                        </Button>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
