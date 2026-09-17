import * as yup from "yup";

export const STAFF_ROLE_OPTIONS = [
    { value: "admin", label: "Administrador" },
    { value: "assistant", label: "Asistente" },
    { value: "psychologist", label: "Psicólogo" },
] as const;

export const staffUserSchema = yup.object({
    name: yup.string().required("El nombre es obligatorio"),
    email: yup
        .string()
        .email("Ingresa un correo válido")
        .required("El correo es obligatorio"),
    role: yup
        .string()
        .oneOf(["admin", "assistant", "psychologist"], "Selecciona un rol")
        .required("Selecciona un rol"),
    // Required only when role === "psychologist" — enforced server-side in
    // createStaffUser rather than via yup's `.when()`, which infers a TS
    // shape (`psychologistId` conditionally required) that react-hook-form's
    // resolver typing can't reconcile with a single static form type.
    // `.default("")` (matching the optional-field convention already used
    // in validators/psychologist.ts) keeps the inferred type a plain
    // `string` instead of `string | undefined`, which is what actually
    // caused the resolver type mismatch.
    psychologistId: yup.string().optional().default(""),
});

export type StaffUserFormData = yup.InferType<typeof staffUserSchema>;
