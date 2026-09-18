"use client";

import { motion } from "motion/react";
import { ease } from "@/lib/motion";
import { CLINICAL_CONSENT_TEXT } from "@/lib/legal/clinical-consent";
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormRadioGroup,
    FormCheckbox,
} from "@/components/form/form-fields";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { COUNTRY_OPTIONS } from "@/lib/countries";

/**
 * Shared between the booking flow's IntakeFormFlow (new appointment) and
 * mi-cuenta/formulario's EditIntakeFormFlow (self-edit, Fase 6.2) — moved
 * here unchanged so the booking flow's behavior doesn't change at all, only
 * its imports do.
 */
export const SECTIONS = [
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
            "religion",
            "country",
        ],
    },
    { title: "Motivo de la sesión", fields: ["consultationReason"] },
    {
        title: "Historial de salud mental",
        fields: [
            "previousTherapy",
            "previousTherapyDetails",
            "currentMedication",
            "currentMedicationDetails",
            "clinicalDataConsent",
        ],
    },
    { title: "Historial médico", fields: ["medicalHistory"] },
    {
        title: "Red de apoyo / contacto de emergencia",
        fields: ["livingWith", "emergencyContact"],
    },
    {
        title: "Expectativas del acompañamiento",
        fields: ["therapyExpectations"],
    },
    {
        title: "Consentimiento informado",
        fields: ["informedConsent", "privacyPolicy"],
    },
] as const;

export function PersonalDataSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Datos personales
            </h2>
            <p className="text-xs text-muted-foreground">
                Para que tu especialista pueda conocer tu historia antes de la
                sesión, preparar un acompañamiento personalizado y ahorrar
                tiempo en presentaciones. Tu información es 100% confidencial.
            </p>
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
                        { value: "Otro", label: "Otro" },
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
                <FormInput name="occupation" label="Ocupación" />
                <FormInput name="religion" label="Religión" />
                <FormSelect
                    name="country"
                    label="País"
                    placeholder="Selecciona..."
                    options={COUNTRY_OPTIONS}
                />
                <FormSelect
                    name="timezone"
                    label="¿Desde dónde te conectas?"
                    placeholder="Selecciona..."
                    options={TIMEZONE_OPTIONS}
                />
            </div>
        </div>
    );
}

export function ConsultationReasonSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Motivo de la sesión
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

export function MentalHealthSection({
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
            <FormCheckbox
                name="clinicalDataConsent"
                label={CLINICAL_CONSENT_TEXT}
            />
        </div>
    );
}

export function MedicalHistorySection() {
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

export function SupportNetworkSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Red de apoyo / contacto de emergencia
            </h2>
            <FormInput
                name="livingWith"
                label="¿Con quién vives actualmente?"
            />
            <FormTextarea
                name="emergencyContact"
                label="¿Cuentas con una persona de contacto en caso de emergencia?"
                description="Comparte su nombre y teléfono."
                rows={3}
                placeholder="Nombre y teléfono..."
            />
        </div>
    );
}

export function TherapyExpectationsSection() {
    return (
        <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">
                Expectativas del acompañamiento
            </h2>
            <FormTextarea
                name="therapyExpectations"
                label="¿Qué esperas lograr con el acompañamiento?"
                rows={5}
                placeholder="Tus metas, lo que te gustaría mejorar..."
            />
        </div>
    );
}

export function ConsentSection() {
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
                label={
                    <>
                        Acepto que la información proporcionada es verídica y he
                        leído y acepto el{" "}
                        <a
                            href="/consentimiento-informado"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline"
                        >
                            Consentimiento Informado
                        </a>{" "}
                        del servicio de acompañamiento ALIA.
                    </>
                }
            />
            <FormCheckbox
                name="privacyPolicy"
                label={
                    <>
                        He leído y acepto la{" "}
                        <a
                            href="/privacidad"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline"
                        >
                            Política de Privacidad
                        </a>
                        .
                    </>
                }
            />
        </div>
    );
}
