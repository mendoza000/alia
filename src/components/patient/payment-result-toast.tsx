"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PaymentResultToast({
    pago,
}: {
    pago: "exitoso" | "cancelado" | undefined;
}) {
    useEffect(() => {
        if (pago === "exitoso") {
            toast.success("Pago recibido, gracias");
        } else if (pago === "cancelado") {
            toast.error("El pago fue cancelado");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
