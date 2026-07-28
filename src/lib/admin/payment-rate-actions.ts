"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { paymentRateSchema } from "@/lib/validators/payment-rate";
import type { PaymentRateFormData } from "@/lib/validators/payment-rate";

type ActionResult = { success: true } | { success: false; error: string };

export async function createRate(
  data: PaymentRateFormData,
): Promise<ActionResult> {
  try {
    const validated = await paymentRateSchema.validate(data, {
      abortEarly: false,
    });

    const existing = await prisma.paymentRate.findUnique({
      where: { currency: validated.currency },
    });
    if (existing) {
      return {
        success: false,
        error: "Ya existe una tarifa para esa moneda",
      };
    }

    await prisma.paymentRate.create({
      data: {
        currency: validated.currency,
        amount: validated.amount,
      },
    });

    revalidatePath("/admin/tarifas");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al crear la tarifa" };
  }
}

export async function updateRate(
  id: string,
  data: PaymentRateFormData,
): Promise<ActionResult> {
  try {
    const validated = await paymentRateSchema.validate(data, {
      abortEarly: false,
    });

    const existing = await prisma.paymentRate.findFirst({
      where: { currency: validated.currency, NOT: { id } },
    });
    if (existing) {
      return {
        success: false,
        error: "Ya existe una tarifa para esa moneda",
      };
    }

    await prisma.paymentRate.update({
      where: { id },
      data: {
        currency: validated.currency,
        amount: validated.amount,
      },
    });

    revalidatePath("/admin/tarifas");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al actualizar la tarifa" };
  }
}

export async function deleteRate(id: string): Promise<ActionResult> {
  try {
    await prisma.paymentRate.delete({ where: { id } });
    revalidatePath("/admin/tarifas");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al eliminar la tarifa" };
  }
}
