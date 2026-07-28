import * as yup from "yup";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export const paymentRateSchema = yup.object({
  currency: yup
    .string()
    .required("La moneda es obligatoria")
    .oneOf(SUPPORTED_CURRENCIES, "Moneda no soportada"),
  amount: yup
    .number()
    .required("El monto es obligatorio")
    .typeError("El monto debe ser un número")
    .min(1, "El monto debe ser mayor a 0"),
});

export type PaymentRateFormData = yup.InferType<typeof paymentRateSchema>;
