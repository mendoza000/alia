"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { CARACAS_TZ } from "@/lib/availability";
import { matchTimezoneOption } from "@/lib/timezones";
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    FileText,
    MoreHorizontal,
    Pencil,
    Receipt,
    StickyNote,
    Trash2,
    UserX,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    cancelAppointment,
    completeAppointment,
    markNoShow,
} from "@/lib/admin/appointment-actions";
import { AppointmentNotesDialog } from "@/components/admin/appointment-notes-dialog";
import { DeleteAppointmentDialog } from "@/components/admin/delete-appointment-dialog";
import { RescheduleAppointmentDialog } from "@/components/admin/reschedule-appointment-dialog";
import {
    createNoShowFeeCharge,
    sendPaymentLinkEmail,
    updatePaymentCommission,
    voidPayment,
} from "@/lib/admin/payment-actions";
import { formatCurrencyAmount } from "@/lib/currency";
import { getPaymentActionFlags } from "@/lib/admin/payment-action-flags";
import { getPatientPhoneFromIntakeFormData } from "@/lib/patient-phone";
import { buildAppointmentWhatsappMessage } from "@/lib/whatsapp-templates";
import { WhatsappReminderMenuItem } from "@/components/admin/whatsapp-reminder-action";
import type { AppointmentRow } from "@/lib/admin/appointment-queries";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";
import type { PayoutType } from "@/generated/prisma/enums";
import { AppointmentStatusBadge } from "@/components/admin/appointment-status-badge";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { GeneratePaymentLinkDialog } from "@/components/admin/generate-payment-link-dialog";
import {
    CommissionSelect,
    PaymentActionsMenuItems,
} from "@/components/admin/payment-actions-menu";
import { EditAppointmentPriceDialog } from "@/components/admin/edit-appointment-price-dialog";
import { RequestCustomAmountDialog } from "@/components/admin/request-custom-amount-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DataTableShell } from "@/components/admin/data-table-shell";

function getInitials(name: string) {
    return name
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function getAppointmentActionFlags(appointment: AppointmentRow) {
    const { canGenerateLink, hasUsableLink, canVoid } = getPaymentActionFlags({
        appointmentStatus: appointment.status,
        paymentStatus: appointment.payment?.status ?? null,
        stripeCheckoutUrl: appointment.payment?.stripeCheckoutUrl ?? null,
    });

    return {
        canComplete: appointment.status === "CONFIRMED",
        canNoShow: appointment.status === "CONFIRMED",
        canSendWhatsapp: appointment.status === "CONFIRMED",
        canCancel: !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
            appointment.status,
        ),
        canDelete: appointment.status === "CANCELLED",
        canReschedule: appointment.status === "CONFIRMED",
        canGenerateLink,
        canChargeNoShowFee: appointment.status === "NO_SHOW",
        hasUsableLink,
        canVoid,
    };
}

/** Shared by the desktop row and the mobile card — see the equivalent note
 * in payment-table.tsx's usePaymentRowActions. */
function useAppointmentActions(
    appointment: AppointmentRow,
    hasAvailableCurrencies: boolean,
    onGenerateLink: (appointment: AppointmentRow) => void,
) {
    const [, startTransition] = useTransition();
    const [isSavingCommission, startCommissionTransition] = useTransition();

    function handleAction(
        action: (id: string) => Promise<{ success: boolean; error?: string }>,
        successMsg: string,
    ) {
        startTransition(async () => {
            const result = await action(appointment.id);
            if (result.success) {
                toast.success(successMsg);
            } else {
                toast.error(result.error ?? "Error al realizar la acción");
            }
        });
    }

    function handleGenerateLinkClick() {
        if (!hasAvailableCurrencies) {
            toast.error(
                "Configura al menos una tarifa en /admin/tarifas primero",
            );
            return;
        }
        onGenerateLink(appointment);
    }

    function handleSendEmail() {
        if (!appointment.payment) return;
        startTransition(async () => {
            const result = await sendPaymentLinkEmail(appointment.id);
            if (result.success) {
                toast.success("Correo enviado");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleNoShowFeeClick() {
        startTransition(async () => {
            const result = await createNoShowFeeCharge(appointment.id);
            if (result.success) {
                toast.success("Multa generada");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleVoid() {
        if (!appointment.payment) return;
        const paymentId = appointment.payment.id;
        startTransition(async () => {
            const result = await voidPayment(paymentId);
            if (result.success) {
                toast.success("Pago anulado");
            } else {
                toast.error(result.error);
            }
        });
    }

    function handleCommissionChange(payoutType: PayoutType) {
        if (!appointment.payment) return;
        const paymentId = appointment.payment.id;
        startCommissionTransition(async () => {
            const result = await updatePaymentCommission(paymentId, payoutType);
            if (result.success) {
                toast.success("Comisión actualizada");
            } else {
                toast.error(result.error);
            }
        });
    }

    return {
        isSavingCommission,
        handleAction,
        handleGenerateLinkClick,
        handleSendEmail,
        handleNoShowFeeClick,
        handleVoid,
        handleCommissionChange,
    };
}

type AppointmentActionsProps = {
    appointment: AppointmentRow;
    hasAvailableCurrencies: boolean;
    canEditPrice: boolean;
    commissionRates: PayoutSettings;
    onGenerateLink: (appointment: AppointmentRow) => void;
    onEditPrice: (appointment: AppointmentRow) => void;
    onDeleteClick: (appointment: AppointmentRow) => void;
    onRescheduleClick: (appointment: AppointmentRow) => void;
    onNotesClick: (appointment: AppointmentRow) => void;
};

function AppointmentActionsMenu({
    appointment,
    hasAvailableCurrencies,
    canEditPrice,
    onGenerateLink,
    onEditPrice,
    onDeleteClick,
    onRescheduleClick,
    onNotesClick,
}: AppointmentActionsProps) {
    const {
        handleAction,
        handleGenerateLinkClick,
        handleSendEmail,
        handleNoShowFeeClick,
        handleVoid,
    } = useAppointmentActions(
        appointment,
        hasAvailableCurrencies,
        onGenerateLink,
    );
    const {
        canComplete,
        canNoShow,
        canSendWhatsapp,
        canCancel,
        canDelete,
        canReschedule,
        canGenerateLink,
        canChargeNoShowFee,
        hasUsableLink,
        canVoid,
    } = getAppointmentActionFlags(appointment);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                    </Button>
                }
            />
            <DropdownMenuContent align="end">
                {appointment.user.intakeForm && (
                    <DropdownMenuItem
                        render={
                            <Link
                                href={`/admin/formularios/${appointment.id}`}
                            />
                        }
                    >
                        <FileText />
                        Ver formulario
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onNotesClick(appointment)}>
                    <StickyNote />
                    {appointment.internalNotes
                        ? "Editar nota interna"
                        : "Agregar nota interna"}
                </DropdownMenuItem>
                {canSendWhatsapp && (
                    <WhatsappReminderMenuItem
                        phone={getPatientPhoneFromIntakeFormData(
                            appointment.user.intakeForm?.data,
                        )}
                        message={buildAppointmentWhatsappMessage({
                            dateTime: appointment.dateTime,
                            timezone: appointment.timezone,
                            patientName: appointment.user.name,
                            psychologistName: appointment.psychologist.name,
                            whatsappReminderTemplate:
                                appointment.psychologist
                                    .whatsappReminderTemplate,
                            whatsappTodaySessionTemplate:
                                appointment.psychologist
                                    .whatsappTodaySessionTemplate,
                        })}
                    />
                )}
                {(canComplete ||
                    canNoShow ||
                    canCancel ||
                    canDelete ||
                    canGenerateLink ||
                    canVoid) && <DropdownMenuSeparator />}
                {(canGenerateLink || canEditPrice) && (
                    <>
                        <PaymentActionsMenuItems
                            canGenerateLink={canGenerateLink}
                            hasUsableLink={hasUsableLink}
                            canVoid={false}
                            onGenerateLinkClick={handleGenerateLinkClick}
                            onSendEmail={handleSendEmail}
                            onVoid={() => {}}
                        />
                        {canGenerateLink && canEditPrice && (
                            <DropdownMenuItem
                                onClick={() => onEditPrice(appointment)}
                            >
                                <Pencil />
                                Editar precio de la sesión
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                    </>
                )}
                {canChargeNoShowFee && (
                    <>
                        <DropdownMenuItem onClick={handleNoShowFeeClick}>
                            <Receipt />
                            Cobrar multa por inasistencia
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                {canVoid && (
                    <>
                        <PaymentActionsMenuItems
                            canGenerateLink={false}
                            hasUsableLink={false}
                            canVoid={canVoid}
                            onGenerateLinkClick={() => {}}
                            onSendEmail={() => {}}
                            onVoid={handleVoid}
                        />
                        <DropdownMenuSeparator />
                    </>
                )}
                {canComplete && (
                    <DropdownMenuItem
                        onClick={() =>
                            handleAction(
                                completeAppointment,
                                "Sesión marcada como completada",
                            )
                        }
                    >
                        <CheckCircle2 />
                        Marcar completada
                    </DropdownMenuItem>
                )}
                {canNoShow && (
                    <DropdownMenuItem
                        onClick={() =>
                            handleAction(markNoShow, "Marcada como no asistió")
                        }
                    >
                        <UserX />
                        No se presentó
                    </DropdownMenuItem>
                )}
                {canReschedule && (
                    <DropdownMenuItem
                        onClick={() => onRescheduleClick(appointment)}
                    >
                        <CalendarClock />
                        Reagendar
                    </DropdownMenuItem>
                )}
                {canCancel && (
                    <>
                        {(canComplete || canNoShow) && (
                            <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                                handleAction(
                                    cancelAppointment,
                                    "Sesión cancelada",
                                )
                            }
                        >
                            <XCircle />
                            Cancelar sesión
                        </DropdownMenuItem>
                    </>
                )}
                {canDelete && (
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDeleteClick(appointment)}
                    >
                        <Trash2 />
                        Eliminar sesión
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function AppointmentRow(props: AppointmentActionsProps) {
    const { appointment, commissionRates } = props;
    const { hasUsableLink } = getAppointmentActionFlags(appointment);
    const { isSavingCommission, handleCommissionChange } =
        useAppointmentActions(
            appointment,
            props.hasAvailableCurrencies,
            props.onGenerateLink,
        );

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                        {appointment.user.image && (
                            <AvatarImage src={appointment.user.image} />
                        )}
                        <AvatarFallback className="text-xs">
                            {getInitials(appointment.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium leading-none">
                            {appointment.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {appointment.user.email}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-sm">
                {appointment.psychologist.name}
            </TableCell>
            <TableCell className="text-sm">
                <p className="font-medium capitalize">
                    {format(
                        new TZDate(appointment.dateTime, CARACAS_TZ),
                        "d MMM yyyy",
                        { locale: es },
                    )}
                </p>
                <p className="text-xs text-muted-foreground">
                    Psicólogo:{" "}
                    {format(
                        new TZDate(appointment.dateTime, CARACAS_TZ),
                        "HH:mm",
                    )}
                </p>
                <p className="text-xs text-muted-foreground">
                    Paciente:{" "}
                    {format(
                        new TZDate(
                            appointment.dateTime,
                            appointment.timezone ?? CARACAS_TZ,
                        ),
                        "HH:mm",
                    )}{" "}
                    (
                    {
                        matchTimezoneOption(appointment.timezone ?? CARACAS_TZ)
                            .label
                    }
                    )
                </p>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                    <AppointmentStatusBadge status={appointment.status} />
                    {appointment.status === "CONFIRMED" &&
                        !appointment.googleEventId && (
                            <Badge
                                variant="outline"
                                className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                title="Esta cita está confirmada pero no tiene evento de Google Calendar — probablemente tampoco se enviaron las notificaciones."
                            >
                                <AlertTriangle className="size-3" />
                                Sin calendario
                            </Badge>
                        )}
                    {appointment.isException && (
                        <Badge
                            variant="outline"
                            className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                            <AlertTriangle className="size-3" />
                            Excepción
                        </Badge>
                    )}
                    {appointment.internalNotes && (
                        <span title={appointment.internalNotes}>
                            <StickyNote className="size-3.5 text-muted-foreground" />
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-1">
                        <span>
                            {appointment.payment
                                ? formatCurrencyAmount(
                                      appointment.payment.finalAmount,
                                      appointment.payment.currency,
                                  )
                                : "—"}
                        </span>
                        {hasUsableLink && (
                            <CopyLinkButton
                                text={
                                    appointment.payment?.stripeCheckoutUrl ?? ""
                                }
                            />
                        )}
                    </div>
                    {appointment.payment && (
                        <CommissionSelect
                            payoutType={appointment.payment.payoutType}
                            commissionRates={commissionRates}
                            disabled={isSavingCommission}
                            onChange={handleCommissionChange}
                            className="h-7 w-32 text-xs"
                        />
                    )}
                </div>
            </TableCell>
            <TableCell>
                {appointment.payment ? (
                    <div className="flex flex-wrap items-center gap-1">
                        <PaymentStatusBadge
                            status={appointment.payment.status}
                        />
                        {appointment.payment.isNoShowFee && (
                            <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            >
                                Multa
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </TableCell>
            <TableCell>
                <AppointmentActionsMenu {...props} />
            </TableCell>
        </TableRow>
    );
}

/** Mobile card — same data as the desktop row, laid out to prioritize who,
 * when and payment status, with the same actions menu instead of the row's
 * dropdown-only affordance getting cramped into a table cell. */
function AppointmentCard(props: AppointmentActionsProps) {
    const { appointment, commissionRates } = props;
    const { hasUsableLink } = getAppointmentActionFlags(appointment);
    const { isSavingCommission, handleCommissionChange } =
        useAppointmentActions(
            appointment,
            props.hasAvailableCurrencies,
            props.onGenerateLink,
        );

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7">
                        {appointment.user.image && (
                            <AvatarImage src={appointment.user.image} />
                        )}
                        <AvatarFallback className="text-xs">
                            {getInitials(appointment.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-none">
                            {appointment.user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {appointment.user.email}
                        </p>
                    </div>
                </div>
                <AppointmentActionsMenu {...props} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <AppointmentStatusBadge status={appointment.status} />
                {appointment.payment ? (
                    <PaymentStatusBadge status={appointment.payment.status} />
                ) : null}
                {appointment.payment?.isNoShowFee && (
                    <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    >
                        Multa
                    </Badge>
                )}
                {appointment.status === "CONFIRMED" &&
                    !appointment.googleEventId && (
                        <Badge
                            variant="outline"
                            className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        >
                            <AlertTriangle className="size-3" />
                            Sin calendario
                        </Badge>
                    )}
                {appointment.isException && (
                    <Badge
                        variant="outline"
                        className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    >
                        <AlertTriangle className="size-3" />
                        Excepción
                    </Badge>
                )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                    <dt className="text-muted-foreground">Psicólogo</dt>
                    <dd>{appointment.psychologist.name}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Fecha</dt>
                    <dd className="capitalize">
                        {format(
                            new TZDate(appointment.dateTime, CARACAS_TZ),
                            "d MMM yyyy, HH:mm",
                            {
                                locale: es,
                            },
                        )}
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-muted-foreground">Monto</dt>
                    <dd className="flex items-center gap-1">
                        <span>
                            {appointment.payment
                                ? formatCurrencyAmount(
                                      appointment.payment.finalAmount,
                                      appointment.payment.currency,
                                  )
                                : "—"}
                        </span>
                        {hasUsableLink && (
                            <CopyLinkButton
                                text={
                                    appointment.payment?.stripeCheckoutUrl ?? ""
                                }
                            />
                        )}
                    </dd>
                </div>
                {appointment.payment && (
                    <div className="col-span-2">
                        <dt className="text-muted-foreground">Comisión</dt>
                        <dd>
                            <CommissionSelect
                                payoutType={appointment.payment.payoutType}
                                commissionRates={commissionRates}
                                disabled={isSavingCommission}
                                onChange={handleCommissionChange}
                                className="h-8 w-full text-xs"
                            />
                        </dd>
                    </div>
                )}
            </dl>
        </div>
    );
}

export function AppointmentsTable({
    appointments,
    availableCurrencies,
    commissionRates,
    canEditPrice,
    canRequestApproval,
}: {
    appointments: AppointmentRow[];
    availableCurrencies: string[];
    commissionRates: PayoutSettings;
    /** payment.commission.write — admin/assistant, not psychologist. Gates
     * "Editar precio de la sesión" and the no-show fee action so a
     * psychologist can generate a link at the agreed price but can't
     * change what that price is. */
    canEditPrice: boolean;
    /** approval.request — psychologist. Gates "Solicitar aprobación de
     * monto" inside GeneratePaymentLinkDialog, shown instead of "Editar
     * precio" when canEditPrice is false. */
    canRequestApproval: boolean;
}) {
    const [activeAppointment, setActiveAppointment] =
        useState<AppointmentRow | null>(null);
    const [editingPriceAppointment, setEditingPriceAppointment] =
        useState<AppointmentRow | null>(null);
    const [requestingApprovalAppointment, setRequestingApprovalAppointment] =
        useState<AppointmentRow | null>(null);
    const [deletingAppointment, setDeletingAppointment] =
        useState<AppointmentRow | null>(null);
    const [reschedulingAppointment, setReschedulingAppointment] =
        useState<AppointmentRow | null>(null);
    const [notesAppointment, setNotesAppointment] =
        useState<AppointmentRow | null>(null);

    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">
                    No se encontraron sesiones
                </p>
            </div>
        );
    }

    const rowProps = (a: AppointmentRow): AppointmentActionsProps => ({
        appointment: a,
        hasAvailableCurrencies: availableCurrencies.length > 0,
        canEditPrice,
        commissionRates,
        onGenerateLink: setActiveAppointment,
        onEditPrice: setEditingPriceAppointment,
        onDeleteClick: setDeletingAppointment,
        onRescheduleClick: setReschedulingAppointment,
        onNotesClick: setNotesAppointment,
    });

    return (
        <>
            <DataTableShell
                items={appointments}
                getKey={a => a.id}
                mobileRender={a => <AppointmentCard {...rowProps(a)} />}
            >
                <Table>
                    <TableHeader className="[&_th]:font-semibold">
                        <TableRow>
                            <TableHead>Persona</TableHead>
                            <TableHead>Psicólogo</TableHead>
                            <TableHead>Fecha / Hora</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.map(a => (
                            <AppointmentRow key={a.id} {...rowProps(a)} />
                        ))}
                    </TableBody>
                </Table>
            </DataTableShell>

            {reschedulingAppointment && (
                <RescheduleAppointmentDialog
                    appointmentId={reschedulingAppointment.id}
                    psychologistName={reschedulingAppointment.psychologist.name}
                    currentDateTime={reschedulingAppointment.dateTime}
                    patientTimezone={reschedulingAppointment.timezone}
                    open={!!reschedulingAppointment}
                    onOpenChange={v => !v && setReschedulingAppointment(null)}
                />
            )}

            {activeAppointment && (
                <GeneratePaymentLinkDialog
                    appointmentId={activeAppointment.id}
                    agreedAmount={activeAppointment.agreedAmount}
                    agreedCurrency={activeAppointment.agreedCurrency}
                    agreedPayoutType={activeAppointment.agreedPayoutType}
                    commissionRates={commissionRates}
                    canEditPrice={canEditPrice}
                    onEditPrice={() => {
                        setEditingPriceAppointment(activeAppointment);
                        setActiveAppointment(null);
                    }}
                    onRequestApproval={() => {
                        setRequestingApprovalAppointment(activeAppointment);
                        setActiveAppointment(null);
                    }}
                    open={!!activeAppointment}
                    onOpenChange={v => !v && setActiveAppointment(null)}
                />
            )}

            {requestingApprovalAppointment && canRequestApproval && (
                <RequestCustomAmountDialog
                    appointmentId={requestingApprovalAppointment.id}
                    agreedAmount={requestingApprovalAppointment.agreedAmount}
                    agreedCurrency={
                        requestingApprovalAppointment.agreedCurrency
                    }
                    availableCurrencies={availableCurrencies}
                    commissionRates={commissionRates}
                    open={!!requestingApprovalAppointment}
                    onOpenChange={v =>
                        !v && setRequestingApprovalAppointment(null)
                    }
                />
            )}

            {editingPriceAppointment && (
                <EditAppointmentPriceDialog
                    appointmentId={editingPriceAppointment.id}
                    agreedAmount={editingPriceAppointment.agreedAmount}
                    agreedCurrency={editingPriceAppointment.agreedCurrency}
                    agreedPayoutType={editingPriceAppointment.agreedPayoutType}
                    availableCurrencies={availableCurrencies}
                    commissionRates={commissionRates}
                    open={!!editingPriceAppointment}
                    onOpenChange={v => !v && setEditingPriceAppointment(null)}
                />
            )}

            {deletingAppointment && (
                <DeleteAppointmentDialog
                    appointmentId={deletingAppointment.id}
                    patientName={deletingAppointment.user.name}
                    open={!!deletingAppointment}
                    onOpenChange={v => !v && setDeletingAppointment(null)}
                />
            )}

            {notesAppointment && (
                <AppointmentNotesDialog
                    appointmentId={notesAppointment.id}
                    patientName={notesAppointment.user.name}
                    initialNotes={notesAppointment.internalNotes}
                    open={!!notesAppointment}
                    onOpenChange={v => !v && setNotesAppointment(null)}
                />
            )}
        </>
    );
}
