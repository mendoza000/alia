"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require";
import { paymentRateSchema } from "@/lib/validators/payment-rate";
import type { PaymentRateFormData } from "@/lib/validators/payment-rate";
import type { RateKind } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function createRate(
    data: PaymentRateFormData,
): Promise<ActionResult> {
    try {
        await requirePermission("rate.write");

        const validated = await paymentRateSchema.validate(data, {
            abortEarly: false,
        });
        const kind = validated.kind as RateKind;

        const existing = await prisma.paymentRate.findUnique({
            where: { currency_kind: { currency: validated.currency, kind } },
        });
        if (existing) {
            return {
                success: false,
                error: "Ya existe una tarifa de este tipo para esa moneda",
            };
        }

        await prisma.paymentRate.create({
            data: {
                currency: validated.currency,
                kind,
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
        await requirePermission("rate.write");

        const validated = await paymentRateSchema.validate(data, {
            abortEarly: false,
        });
        const kind = validated.kind as RateKind;

        const existing = await prisma.paymentRate.findFirst({
            where: { currency: validated.currency, kind, NOT: { id } },
        });
        if (existing) {
            return {
                success: false,
                error: "Ya existe una tarifa de este tipo para esa moneda",
            };
        }

        await prisma.paymentRate.update({
            where: { id },
            data: {
                currency: validated.currency,
                kind,
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
        await requirePermission("rate.write");

        await prisma.paymentRate.delete({ where: { id } });
        revalidatePath("/admin/tarifas");
        return { success: true };
    } catch (err) {
        if (err instanceof Error) return { success: false, error: err.message };
        return { success: false, error: "Error al eliminar la tarifa" };
    }
}
