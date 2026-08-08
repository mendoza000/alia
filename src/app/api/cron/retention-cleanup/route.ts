import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const RETENTION_DAYS = 60;
const BATCH_SIZE = 500;

const CLINICAL_DATA_KEYS = [
    "previousTherapy",
    "previousTherapyDetails",
    "currentMedication",
    "currentMedicationDetails",
    "medicalHistory",
    "consultationReason",
    "therapyExpectations",
] as const;

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoffDate = new Date(
        Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const eligibleForms = await prisma.intakeForm.findMany({
        where: {
            clinicalDataRedactedAt: null,
            appointment: {
                status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
                finalizedAt: { lt: cutoffDate },
            },
        },
        select: { id: true, data: true },
        take: BATCH_SIZE,
    });

    let redacted = 0;
    for (const form of eligibleForms) {
        const data = { ...(form.data as Record<string, unknown>) };
        for (const key of CLINICAL_DATA_KEYS) {
            delete data[key];
        }

        await prisma.intakeForm.update({
            where: { id: form.id },
            data: {
                data: data as Prisma.InputJsonValue,
                clinicalDataRedactedAt: new Date(),
            },
        });
        redacted++;
    }

    return NextResponse.json({
        redacted,
        timestamp: new Date().toISOString(),
    });
}
