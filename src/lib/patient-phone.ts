/** IntakeForm.data is an unstructured Json column — this defensively reads
 * the `phone` field out of it the same way clientes/[userId]/page.tsx did
 * inline, extracted so both that page and the WhatsApp reminder action can
 * share it. */
export function getPatientPhoneFromIntakeFormData(
    data: unknown,
): string | null {
    if (typeof data !== "object" || data === null) return null;

    const phone = (data as Record<string, unknown>).phone;
    if (typeof phone !== "string") return null;

    const trimmed = phone.trim();
    return trimmed === "" ? null : trimmed;
}
