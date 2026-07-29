import * as yup from "yup";

export const intakeFormSchema = yup.object({
    // Section 1: Datos personales
    fullName: yup.string().required("El nombre completo es obligatorio"),
    email: yup
        .string()
        .required("El correo es obligatorio")
        .email("Ingresa un correo válido"),
    phone: yup.string().required("El teléfono es obligatorio"),
    dateOfBirth: yup.string().required("La fecha de nacimiento es obligatoria"),
    gender: yup.string().required("Selecciona tu género"),
    maritalStatus: yup.string().required("Selecciona tu estado civil"),
    occupation: yup.string().required("La ocupación es obligatoria"),
    religion: yup.string().default(""),

    // Section 2: Motivo de la sesión
    consultationReason: yup
        .string()
        .required("El motivo de la sesión es obligatorio"),

    // Section 3: Historial de salud mental
    previousTherapy: yup
        .string()
        .required("Indica si has tenido tratamiento previo")
        .oneOf(["Sí", "No"]),
    previousTherapyDetails: yup.string().when("previousTherapy", {
        is: "Sí",
        then: schema =>
            schema.required("Describe brevemente tus tratamientos anteriores"),
        otherwise: schema => schema.default(""),
    }),
    currentMedication: yup
        .string()
        .required("Indica si tomas medicación actualmente")
        .oneOf(["Sí", "No"]),
    currentMedicationDetails: yup.string().when("currentMedication", {
        is: "Sí",
        then: schema =>
            schema.required("Indica qué medicación tomas actualmente"),
        otherwise: schema => schema.default(""),
    }),

    // Section 4: Historial médico
    medicalHistory: yup.string().default(""),

    // Section 5: Red de apoyo / contacto de emergencia
    livingWith: yup.string().default(""),
    emergencyContact: yup.string().default(""),

    // Section 6: Expectativas
    therapyExpectations: yup
        .string()
        .required("Indica qué esperas lograr con el acompañamiento"),

    // Section 7: Consentimiento
    informedConsent: yup
        .boolean()
        .oneOf([true], "Debes aceptar el consentimiento informado")
        .required(),
    privacyPolicy: yup
        .boolean()
        .oneOf([true], "Debes aceptar la política de privacidad")
        .required(),
});

export type IntakeFormData = {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    maritalStatus: string;
    occupation: string;
    religion: string;
    consultationReason: string;
    previousTherapy: string;
    previousTherapyDetails: string;
    currentMedication: string;
    currentMedicationDetails: string;
    medicalHistory: string;
    livingWith: string;
    emergencyContact: string;
    therapyExpectations: string;
    informedConsent: boolean;
    privacyPolicy: boolean;
};
