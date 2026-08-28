import { Client } from "@upstash/qstash";
import { getBaseUrl } from "@/lib/email";
import {
    INTAKE_FORM_REMINDER_MINUTES,
    PENDING_FORM_EXPIRY_MINUTES,
} from "@/lib/availability";

const qstash = process.env.QSTASH_TOKEN
    ? new Client({ token: process.env.QSTASH_TOKEN })
    : null;

// Schedules the two follow-ups for a freshly created PENDING_FORM appointment.
// Both target routes re-check the appointment's status before acting, so it's
// safe to fire these unconditionally — they no-op once the form is submitted.
export async function scheduleIntakeFormFollowUps(
    appointmentId: string,
): Promise<void> {
    if (!qstash) {
        console.error(
            "QSTASH_TOKEN not configured — skipping intake form follow-ups for",
            appointmentId,
        );
        return;
    }

    const baseUrl = getBaseUrl();

    try {
        await Promise.all([
            qstash.publishJSON({
                url: `${baseUrl}/api/qstash/intake-form-reminder`,
                body: { appointmentId },
                delay: `${INTAKE_FORM_REMINDER_MINUTES}m`,
            }),
            qstash.publishJSON({
                url: `${baseUrl}/api/qstash/expire-pending-form`,
                body: { appointmentId },
                delay: `${PENDING_FORM_EXPIRY_MINUTES}m`,
            }),
        ]);
    } catch (err) {
        console.error("Failed to schedule intake form follow-ups:", err);
    }
}
