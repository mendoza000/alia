import * as yup from "yup";

export const siteSettingsSchema = yup.object({
    whatsappNumber: yup
        .string()
        .trim()
        .transform(v => (v === "" ? null : v))
        .matches(
            /^[0-9]{7,15}$/,
            "Debe incluir el código de país y solo dígitos (ej: 573001234567)",
        )
        .nullable()
        .defined(),
    instagramUrl: yup
        .string()
        .trim()
        .transform(v => (v === "" ? null : v))
        .url("Debe ser una URL válida (ej: https://instagram.com/alia)")
        .nullable()
        .defined(),
    contactEmail: yup
        .string()
        .trim()
        .transform(v => (v === "" ? null : v))
        .email("Debe ser un email válido")
        .nullable()
        .defined(),
});

export type SiteSettingsFormData = yup.InferType<typeof siteSettingsSchema>;
