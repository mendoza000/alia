"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { FileText, User } from "lucide-react";
import { CARACAS_TZ } from "@/lib/availability";
import { formatCurrencyAmount } from "@/lib/currency";
import { getPatientPhoneFromIntakeFormData } from "@/lib/patient-phone";
import { getAppointmentDetailAction } from "@/lib/admin/appointment-detail-actions";
import type { AppointmentDetail } from "@/lib/admin/appointment-queries";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {label}
            </p>
            <p className="mt-0.5 text-sm">{value}</p>
        </div>
    );
}

export function AppointmentDetailSheet({
    appointmentId,
    onOpenChange,
}: {
    appointmentId: string | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [detail, setDetail] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!appointmentId) {
            setDetail(null);
            return;
        }
        setIsLoading(true);
        setDetail(null);
        getAppointmentDetailAction(appointmentId)
            .then(setDetail)
            .finally(() => setIsLoading(false));
    }, [appointmentId]);

    const phone = detail?.user.intakeForm
        ? getPatientPhoneFromIntakeFormData(detail.user.intakeForm.data)
        : null;

    return (
        <Sheet open={!!appointmentId} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full flex-col bg-card sm:min-w-md"
            >
                <SheetHeader>
                    <SheetTitle className="font-sans text-lg font-semibold">
                        {detail ? detail.user.name : "Detalle de la cita"}
                    </SheetTitle>
                    {detail && (
                        <SheetDescription>
                            Sesión con {detail.psychologist.name}
                        </SheetDescription>
                    )}
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
                    {isLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    )}

                    {!isLoading && detail && (
                        <>
                            <div className="space-y-3">
                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                    Sesión
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Fecha y hora"
                                        value={format(
                                            new TZDate(
                                                detail.dateTime,
                                                CARACAS_TZ,
                                            ),
                                            "d 'de' MMMM, h:mm a",
                                            { locale: es },
                                        )}
                                    />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Estado
                                        </p>
                                        <div className="mt-1">
                                            <AppointmentStatusBadge
                                                status={detail.status}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-border pt-4">
                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                    Pago
                                </h3>
                                {detail.payment ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field
                                            label="Monto"
                                            value={formatCurrencyAmount(
                                                detail.payment.finalAmount,
                                                detail.payment.currency,
                                            )}
                                        />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                Estado
                                            </p>
                                            <div className="mt-1">
                                                <PaymentStatusBadge
                                                    status={
                                                        detail.payment.status
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Sin link de pago generado.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 border-t border-border pt-4">
                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                    Cliente
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Correo"
                                        value={detail.user.email}
                                    />
                                    <Field
                                        label="Teléfono"
                                        value={phone ?? "—"}
                                    />
                                </div>
                                <Link
                                    href={`/admin/clientes/${detail.user.id}`}
                                >
                                    <Button variant="outline" size="sm">
                                        <User />
                                        Ver ficha del cliente
                                    </Button>
                                </Link>
                            </div>

                            <div className="space-y-3 border-t border-border pt-4">
                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                    Formulario
                                </h3>
                                {detail.user.intakeForm ? (
                                    <Link
                                        href={`/admin/formularios/${detail.id}`}
                                    >
                                        <Button variant="outline" size="sm">
                                            <FileText />
                                            Ver formulario completo
                                        </Button>
                                    </Link>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        El paciente no ha completado el
                                        formulario.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
