import * as yup from "yup";

export const availabilityQuerySchema = yup.object({
    psychologistId: yup.string().required("psychologistId es obligatorio"),
    date: yup
        .string()
        .required("date es obligatorio")
        .matches(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
});

export type AvailabilityQueryData = yup.InferType<
    typeof availabilityQuerySchema
>;
