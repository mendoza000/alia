import * as yup from "yup";

export const createAppointmentSchema = yup.object({
    psychologistId: yup.string().required("psychologistId es obligatorio"),
    dateTime: yup
        .string()
        .required("dateTime es obligatorio")
        .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato YYYY-MM-DDTHH:MM"),
});

export type CreateAppointmentData = yup.InferType<
    typeof createAppointmentSchema
>;
