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
  sessionRate: yup
    .number()
    .required("La tarifa es obligatoria")
    .typeError("La tarifa debe ser un número")
    .min(1000, "La tarifa mínima es $1.000 COP"),
  sessionDuration: yup
    .number()
    .required("La duración es obligatoria")
    .typeError("Selecciona una duración")
    .oneOf([30, 45, 60, 90], "Duración no válida"),
  calendarId: yup.string().optional().default(""),
  photoUrl: yup.string().optional().url("Ingresa una URL válida").default(""),
  isActive: yup.boolean().default(true),
});

export type PsychologistFormData = yup.InferType<typeof psychologistSchema>;
