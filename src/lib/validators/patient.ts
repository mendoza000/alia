import * as yup from "yup";

/**
 * Narrow, dedicated schema for updatePatientProfile — deliberately not
 * intakeFormAdminUpdateSchema, which validates the entire intake form
 * (every required field: occupation, emergency contact, consent, etc).
 * Reusing it here would block a simple name/phone edit on unrelated gaps
 * in an older, otherwise-complete intake form.
 */
export const patientProfileUpdateSchema = yup.object({
    name: yup.string().required("El nombre es obligatorio"),
    phone: yup.string().optional().default(""),
    dateOfBirth: yup.string().optional().default(""),
});

export type PatientProfileFormData = yup.InferType<
    typeof patientProfileUpdateSchema
>;
