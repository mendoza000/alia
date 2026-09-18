import type {
    AppointmentStatus,
    PaymentStatus,
} from "@/generated/prisma/enums";

/**
 * Pure gate logic shared by appointments-table.tsx and payment-table.tsx —
 * previously duplicated separately in each (appointments-table computed
 * canGenerateLink/hasUsableLink locally; payment-table only inlined
 * hasUsableLink and assumed canVoid from p.status === "PENDING").
 */
export function getPaymentActionFlags({
    appointmentStatus,
    paymentStatus,
    stripeCheckoutUrl,
}: {
    appointmentStatus: AppointmentStatus;
    paymentStatus: PaymentStatus | null;
    stripeCheckoutUrl: string | null;
}) {
    return {
        canGenerateLink:
            ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(appointmentStatus) &&
            paymentStatus !== "APPROVED",
        hasUsableLink:
            paymentStatus === "PENDING" && Boolean(stripeCheckoutUrl),
        canVoid: paymentStatus === "PENDING",
    };
}
