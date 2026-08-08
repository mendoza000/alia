import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.appointment.updateMany({
        where: {
            status: "CONFIRMED",
            endTime: { lt: new Date() },
        },
        data: { status: "COMPLETED", finalizedAt: new Date() },
    });

    return NextResponse.json({
        completed: result.count,
        timestamp: new Date().toISOString(),
    });
}
