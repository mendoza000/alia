const WHATSAPP_PHONE_PATTERN = /^[0-9]{7,15}$/;

/** Same shape as `SiteSettings.whatsappNumber` (see src/lib/validators/site-settings.ts):
 * digits only, country code included, 7-15 digits long. Patient phone numbers
 * come from unvalidated free text (IntakeForm.data.phone), so this strips
 * everything but digits before checking the shape. */
export function normalizeWhatsappPhone(
    raw: string | null | undefined,
): string | null {
    if (!raw) return null;

    const digits = raw.replace(/\D/g, "");
    return WHATSAPP_PHONE_PATTERN.test(digits) ? digits : null;
}

export function buildWhatsappLink(phone: string, message: string): string {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
