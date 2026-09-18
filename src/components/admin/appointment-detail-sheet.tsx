"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import {
    Calendar,
    CreditCard,
    FileText,
    StickyNote,
    Tag,
    User,
    UserX,
} from "lucide-react";
import { CARACAS_TZ, getSessionDuration } from "@/lib/availability";
import { formatCurrencyAmount } from "@/lib/currency";
import { getPatientPhoneFromIntakeFormData } from "@/lib/patient-phone";
import { getAppointmentDetailAction } from "@/lib/admin/appointment-detail-actions";
import type { AppointmentDetail } from "@/lib/admin/appointment-queries";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

const SESSION_TYPE_LABELS: Record<string, string> = {
    INDIVIDUAL: "Individual",
    COUPLE: "Pareja",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
                <Icon className="size-4 text-muted-foreground" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
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
    const country = detail?.patientCountry;
    const duration = detail
        ? getSessionDuration(detail.psychologist, detail.sessionType)
        : null;

    return (
        <Sheet open={!!appointmentId} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full flex-col gap-0 bg-card sm:min-w-lg"
            >
                <SheetHeader className="border-b border-border pb-4">
                    {detail ? (
                        <div className="flex items-center gap-3">
                            <Avatar size="lg">
                                <AvatarImage
                                    src={detail.user.image ?? undefined}
                                />
                                <AvatarFallback>
                                    {getInitials(detail.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <SheetTitle className="truncate font-sans text-lg font-semibold">
                                    {detail.user.name}
                                </SheetTitle>
                                <SheetDescription className="truncate">
                                    Sesión{" "}
                                    {SESSION_TYPE_LABELS[
                                        detail.sessionType
                                    ]?.toLowerCase()}{" "}
                                    con {detail.psychologist.name}
                                </SheetDescription>
                            </div>
                        </div>
                    ) : (
                        <SheetTitle className="font-sans text-lg font-semibold">
                            Detalle de la cita
                        </SheetTitle>
                    )}
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
                    {isLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    )}

                    {!isLoading && detail && (
                        <>
                            <Section icon={Calendar} title="Sesión">
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
                                    <Field
                                        label="Duración"
                                        value={`${duration} minutos`}
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
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Modalidad
                                        </p>
                                        <div className="mt-1">
                                            <Badge variant="secondary">
                                                {SESSION_TYPE_LABELS[
                                                    detail.sessionType
                                                ] ?? detail.sessionType}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            <Section icon={CreditCard} title="Pago">
                                {detail.payment ? (
                                    <div className="space-y-3">
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
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <PaymentStatusBadge
                                                        status={
                                                            detail.payment
                                                                .status
                                                        }
                                                    />
                                                    {detail.payment
                                                        .isNoShowFee && (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1"
                                                        >
                                                            <UserX className="size-3" />
                                                            Multa
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {detail.payment.paidAt && (
                                                <Field
                                                    label="Pagado el"
                                                    value={format(
                                                        new TZDate(
                                                            detail.payment
                                                                .paidAt,
                                                            CARACAS_TZ,
                                                        ),
                                                        "d 'de' MMMM, yyyy",
                                                        { locale: es },
                                                    )}
                                                />
                                            )}
                                            {detail.payment.coupon && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                        Cupón
                                                    </p>
                                                    <div className="mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1"
                                                        >
                                                            <Tag className="size-3" />
                                                            {
                                                                detail.payment
                                                                    .coupon.code
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {detail.payment.stripeCheckoutUrl && (
                                            <CopyLinkButton
                                                text={
                                                    detail.payment
                                                        .stripeCheckoutUrl
                                                }
                                                label="Copiar link de pago"
                                                showLabel
                                                variant="outline"
                                                size="sm"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Sin link de pago generado.
                                    </p>
                                )}
                            </Section>

                            <Section icon={User} title="Cliente">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="Correo"
                                        value={detail.user.email}
                                    />
                                    <Field
                                        label="Teléfono"
                                        value={phone ?? "—"}
                                    />
                                    {country && (
                                        <Field label="País" value={country} />
                                    )}
                                </div>
                                <Link
                                    href={`/admin/clientes/${detail.user.id}`}
                                >
                                    <Button variant="outline" size="sm">
                                        <User />
                                        Ver ficha del cliente
                                    </Button>
                                </Link>
                            </Section>

                            {(detail.notes || detail.internalNotes) && (
                                <Section icon={StickyNote} title="Notas">
                                    {detail.notes && (
                                        <Field
                                            label="Nota de la sesión"
                                            value={detail.notes}
                                        />
                                    )}
                                    {detail.internalNotes && (
                                        <Field
                                            label="Nota interna"
                                            value={detail.internalNotes}
                                        />
                                    )}
                                </Section>
                            )}

                            <Section icon={FileText} title="Formulario">
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
                            </Section>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
