"use client";

import { useEffect } from "react";
import { trackBookingConfirmed } from "@/lib/analytics/events";

type Props = {
    appointmentId: string;
    value?: number;
    currency?: string;
};

export function BookingConfirmedTracker({
    appointmentId,
    value,
    currency,
}: Props) {
    useEffect(() => {
        const dedupeKey = `alia-tracked-purchase-${appointmentId}`;
        if (sessionStorage.getItem(dedupeKey)) return;
        sessionStorage.setItem(dedupeKey, "1");

        trackBookingConfirmed(
            appointmentId,
            value !== undefined && currency ? { value, currency } : undefined,
        );
    }, [appointmentId, value, currency]);

    return null;
}
