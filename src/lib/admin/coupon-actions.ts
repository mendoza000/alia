"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { couponSchema } from "@/lib/validators/coupon";
import type { CouponFormData } from "@/lib/validators/coupon";

type ActionResult = { success: true } | { success: false; error: string };

export async function createCoupon(data: CouponFormData): Promise<ActionResult> {
  try {
    const validated = await couponSchema.validate(data, { abortEarly: false });

    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });
    if (existing) {
      return { success: false, error: "Ya existe un cupón con ese código" };
    }

    await prisma.coupon.create({
      data: {
        code: validated.code,
        discountPercent: validated.discountPercent,
        maxUses: validated.maxUses ?? null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive ?? true,
      },
    });

    revalidatePath("/admin/cupones");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al crear el cupón" };
  }
}

export async function updateCoupon(
  id: string,
  data: CouponFormData,
): Promise<ActionResult> {
  try {
    const validated = await couponSchema.validate(data, { abortEarly: false });

    const existing = await prisma.coupon.findFirst({
      where: { code: validated.code, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: "Ya existe un cupón con ese código" };
    }

    await prisma.coupon.update({
      where: { id },
      data: {
        code: validated.code,
        discountPercent: validated.discountPercent,
        maxUses: validated.maxUses ?? null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive ?? true,
      },
    });

    revalidatePath("/admin/cupones");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Error al actualizar el cupón" };
  }
}

export async function toggleCoupon(id: string): Promise<ActionResult> {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return { success: false, error: "Cupón no encontrado" };

  await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });

  revalidatePath("/admin/cupones");
  return { success: true };
}
