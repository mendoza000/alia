import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type JSX } from "react";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/require";
import { can } from "@/lib/auth/permissions";
import { getSessionsReportData } from "@/lib/admin/report-queries";
import { SessionsReportPDF } from "@/components/admin/sessions-report-pdf";

export async function GET(req: Request) {
    const actor = await getCurrentActor();
    if (!actor || !can(actor.role, "appointment.read.all")) {
        return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const psychologistId = searchParams.get("psychologistId") ?? undefined;
    const showPending = searchParams.get("showPending") !== "false";

    if (!dateFrom || !dateTo) {
        return new NextResponse("Debes indicar un rango de fechas", {
            status: 400,
        });
    }

    const [psychologists, scopePsychologist] = await Promise.all([
        getSessionsReportData({ dateFrom, dateTo, psychologistId }),
        psychologistId
            ? prisma.psychologist.findUnique({
                  where: { id: psychologistId },
                  select: { name: true },
              })
            : Promise.resolve(null),
    ]);

    const scopeLabel = scopePsychologist
        ? scopePsychologist.name
        : "Todos los psicólogos";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(SessionsReportPDF, {
        psychologists,
        dateFrom,
        dateTo,
        scopeLabel,
        showPending,
    }) as JSX.Element as Parameters<typeof renderToBuffer>[0];

    let buffer: Buffer;
    try {
        buffer = await renderToBuffer(element);
    } catch (err) {
        console.error("PDF render failed:", err);
        return new NextResponse("No se pudo generar el reporte", {
            status: 500,
        });
    }

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="reporte-sesiones-${dateFrom}-a-${dateTo}.pdf"`,
        },
    });
}
