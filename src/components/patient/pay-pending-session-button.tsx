"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createMyPaymentLink } from "@/lib/patient/appointment-actions";
import { Button } from "@/components/ui/button";

export function PayPendingSessionButton({
    appointmentId,
}: {
    appointmentId: string;
}) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            const result = await createMyPaymentLink(appointmentId);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            // External Stripe URL — a client-side navigation, not a Next
            // route, so router.push doesn't apply here.
            window.location.href = result.url;
        });
    }

    return (
        <Button size="sm" onClick={handleClick} isLoading={isPending}>
            Pagar sesión
        </Button>
    );
}
