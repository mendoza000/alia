import { redirect } from "next/navigation";

// "Formularios" evolved into "Clientes" (PRD §6.8) — the list view lives
// there now. The detail route (/admin/formularios/[appointmentId]) is
// unchanged: it's linked directly from Google Calendar event descriptions
// (calendar-events.ts) and from the Clientes detail page.
export default function FormulariosPage() {
    redirect("/admin/clientes");
}
