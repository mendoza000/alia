import * as yup from "yup";

export const payoutSettingsSchema = yup.object({
    newClientRatePercent: yup
        .number()
        .required("El % de cita nueva es obligatorio")
        .typeError("Debe ser un número")
        .min(0, "No puede ser negativo")
        .max(100, "No puede superar 100"),
    recurringClientRatePercent: yup
        .number()
        .required("El % de cita recurrente es obligatorio")
        .typeError("Debe ser un número")
        .min(0, "No puede ser negativo")
        .max(100, "No puede superar 100"),
    loyalRatePercent: yup
        .number()
        .required("El % de comisión leal es obligatorio")
        .typeError("Debe ser un número")
        .min(0, "No puede ser negativo")
        .max(100, "No puede superar 100"),
    loyalNewRatePercent: yup
        .number()
        .required("El % de comisión leal nuevo es obligatorio")
        .typeError("Debe ser un número")
        .min(0, "No puede ser negativo")
        .max(100, "No puede superar 100"),
});

export type PayoutSettingsFormData = yup.InferType<typeof payoutSettingsSchema>;
