import * as yup from "yup";

export const whatsappTemplatesSchema = yup.object({
    whatsappReminderTemplate: yup
        .string()
        .trim()
        .transform(v => (v === "" ? null : v))
        .nullable()
        .defined(),
    whatsappTodaySessionTemplate: yup
        .string()
        .trim()
        .transform(v => (v === "" ? null : v))
        .nullable()
        .defined(),
});

export type WhatsappTemplatesFormData = yup.InferType<
    typeof whatsappTemplatesSchema
>;
