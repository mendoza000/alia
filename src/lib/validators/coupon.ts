import * as yup from "yup";

export const couponSchema = yup.object({
  code: yup
    .string()
    .required("El código es obligatorio")
    .min(3, "El código debe tener al menos 3 caracteres")
    .max(30, "El código no puede superar los 30 caracteres")
    .matches(/^[A-Z0-9_-]+$/, "Solo letras mayúsculas, números, guiones y guiones bajos"),
  discountPercent: yup
    .number()
    .required("El descuento es obligatorio")
    .typeError("El descuento debe ser un número")
    .min(1, "El descuento mínimo es 1%")
    .max(100, "El descuento máximo es 100%"),
  maxUses: yup
    .number()
    .transform((value, original) => (original === "" || original === null ? undefined : value))
    .optional()
    .typeError("El número de usos debe ser un número")
    .min(1, "El mínimo de usos es 1"),
  expiresAt: yup
    .string()
    .transform((value) => value || undefined)
    .optional(),
  isActive: yup.boolean().default(true),
});

export type CouponFormData = {
  code: string;
  discountPercent: number;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
};
