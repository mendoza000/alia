import { GOOGLE_ADS_BOOKING_LABEL, GOOGLE_ADS_ID, gtagEvent } from "./gtag";
import { fbqTrack } from "./meta-pixel";

type Money = { value: number; currency: string };

export function trackInitiateCheckout(money?: Money) {
    fbqTrack("InitiateCheckout", money);
    gtagEvent("begin_checkout", money);
}

export function trackBookingConfirmed(appointmentId: string, money?: Money) {
    fbqTrack("Purchase", money);
    gtagEvent("purchase", { transaction_id: appointmentId, ...money });

    if (GOOGLE_ADS_ID && GOOGLE_ADS_BOOKING_LABEL) {
        gtagEvent("conversion", {
            send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_BOOKING_LABEL}`,
            transaction_id: appointmentId,
            ...money,
        });
    }
}
