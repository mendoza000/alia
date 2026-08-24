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

    // A form is now shared across all of a patient's appointments, so eligibility can't
    // be decided from a single appointment anymore: only redact once the patient has no
    // active/upcoming appointment left, and their last finalized one is old enough.
    const eligibleForms = await prisma.intakeForm.findMany({
        where: {
            clinicalDataRedactedAt: null,
            user: {
                appointments: {
                    none: { status: { in: ["PENDING_FORM", "CONFIRMED"] } },
                },
            },
        },
        select: { id: true, userId: true, data: true },
        take: BATCH_SIZE,
    });

    let redacted = 0;
    for (const form of eligibleForms) {
        const lastFinalized = await prisma.appointment.aggregate({
            where: {
                userId: form.userId,
                status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
            },
            _max: { finalizedAt: true },
        });

        const lastFinalizedAt = lastFinalized._max.finalizedAt;
        if (!lastFinalizedAt || lastFinalizedAt >= cutoffDate) continue;

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
