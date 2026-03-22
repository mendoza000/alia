import * as yup from "yup";

export const scheduleBlockSchema = yup.object({
  dayOfWeek: yup
    .number()
    .required()
    .min(0, "Día no válido")
    .max(6, "Día no válido")
    .integer(),
  startTime: yup
    .string()
    .required("La hora de inicio es obligatoria")
    .matches(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: yup
    .string()
    .required("La hora de fin es obligatoria")
    .matches(/^\d{2}:\d{2}$/, "Formato HH:MM")
    .test(
      "after-start",
      "La hora de fin debe ser posterior a la de inicio",
      function (endTime) {
        const { startTime } = this.parent;
        if (!startTime || !endTime) return true;
        return endTime > startTime;
      },
    ),
  isActive: yup.boolean().default(true),
});

export const schedulesSchema = yup.array().of(scheduleBlockSchema).default([]);

export type ScheduleBlockData = yup.InferType<typeof scheduleBlockSchema>;
