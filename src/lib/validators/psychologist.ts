import * as yup from "yup";

export const psychologistSchema = yup.object({
    name: yup
        .string()
        .required("El nombre es obligatorio")
        .min(2, "El nombre debe tener al menos 2 caracteres"),
    email: yup
        .string()
        .required("El correo es obligatorio")
        .email("Ingresa un correo válido"),
    phone: yup.string().optional().default(""),
    specialty: yup.string().required("La especialidad es obligatoria"),
    bio: yup
        .string()
        .required("La biografía es obligatoria")
        .min(20, "La biografía debe tener al menos 20 caracteres"),
    sessionDuration: yup
        .number()
        .required("La duración es obligatoria")
        .typeError("Selecciona una duración")
        .oneOf([30, 45, 60, 90], "Duración no válida"),
    // Its own options/oneOf, deliberately not the sessionDuration set above —
    // 120 shouldn't be selectable as an *individual*-session duration too.
    coupleSessionDuration: yup
        .number()
        .required("La duración de pareja es obligatoria")
        .typeError("Selecciona una duración")
        .oneOf([90, 120, 150], "Duración no válida")
        .default(120),
    offeredSessionTypes: yup
        .array()
        .of(yup.string().oneOf(["INDIVIDUAL", "COUPLE"]).required())
        .min(1, "Selecciona al menos una modalidad")
        .default(["INDIVIDUAL"]),
    calendarId: yup.string().optional().default(""),
    photoUrl: yup.string().optional().url("Ingresa una URL válida").default(""),
    isActive: yup.boolean().default(true),
});

export type PsychologistFormData = yup.InferType<typeof psychologistSchema>;
