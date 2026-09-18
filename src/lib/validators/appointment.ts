import * as yup from "yup";

export const createAutoAssignedAppointmentSchema = yup.object({
    sessionType: yup
        .mixed<"INDIVIDUAL" | "COUPLE">()
        .oneOf(["INDIVIDUAL", "COUPLE"])
        .required("sessionType es obligatorio"),
    dateTime: yup
        .string()
        .required("dateTime es obligatorio")
        .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato YYYY-MM-DDTHH:MM"),
    timezone: yup.string().default("America/Bogota"),
    termsVersion: yup
        .string()
        .required("Debes aceptar los Términos y Condiciones"),
});

export type CreateAutoAssignedAppointmentData = yup.InferType<
    typeof createAutoAssignedAppointmentSchema
>;

export const createAppointmentSchema = yup.object({
    psychologistId: yup.string().required("psychologistId es obligatorio"),
    dateTime: yup
        .string()
        .required("dateTime es obligatorio")
        .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato YYYY-MM-DDTHH:MM"),
    timezone: yup.string().default("America/Bogota"),
    termsVersion: yup
        .string()
        .required("Debes aceptar los Términos y Condiciones"),
});

export type CreateAppointmentData = yup.InferType<
    typeof createAppointmentSchema
>;
