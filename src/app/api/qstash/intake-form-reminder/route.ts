import { NextResponse, type NextRequest } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/db";
import { sendIntakeFormReminder } from "@/lib/email";

async function handler(request: NextRequest) {
    const { appointmentId } = (await request.json()) as {
        appointmentId?: string;
    };

    if (!appointmentId) {
        return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true },
    });

    // Already confirmed, cancelled, or gone — nothing to remind.
    if (!appointment || appointment.status !== "PENDING_FORM") {
        return NextResponse.json({ skipped: true });
    }

    await sendIntakeFormReminder(appointmentId);

    return NextResponse.json({ sent: true });
}

export const POST = verifySignatureAppRouter(handler);
