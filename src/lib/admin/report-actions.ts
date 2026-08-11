"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type JSX } from "react";
import { prisma } from "@/lib/db";
import { getSessionsReportData } from "@/lib/admin/report-queries";
import { SessionsReportPDF } from "@/components/admin/sessions-report-pdf";
import { sendSessionsReportEmail } from "@/lib/email";

type ActionResult =
  | { success: true; sentCount: number }
  | { success: false; error: string };

export async function emailSessionsReport(filters: {
  dateFrom: string;
  dateTo: string;
  psychologistId?: string;
}): Promise<ActionResult> {
  try {
    const psychologists = await getSessionsReportData(filters);
    const withSessions = psychologists.filter((p) => p.sessions.length > 0);

    if (withSessions.length === 0) {
      return { success: false, error: "No hay sesiones en ese rango para enviar" };
    }

    const emailsById = new Map(
      (
        await prisma.psychologist.findMany({
          where: { id: { in: withSessions.map((p) => p.id) } },
          select: { id: true, email: true },
        })
      ).map((p) => [p.id, p.email]),
    );

    for (const psychologist of withSessions) {
      const email = emailsById.get(psychologist.id);
      if (!email) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = createElement(SessionsReportPDF, {
        psychologists: [psychologist],
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        scopeLabel: psychologist.name,
      }) as JSX.Element as Parameters<typeof renderToBuffer>[0];

      const pdfBuffer = await renderToBuffer(element);

      await sendSessionsReportEmail({
        to: email,
        psychologistName: psychologist.name,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        pdfBuffer,
      });
    }

    return { success: true, sentCount: withSessions.length };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "No se pudo enviar el reporte" };
  }
}
