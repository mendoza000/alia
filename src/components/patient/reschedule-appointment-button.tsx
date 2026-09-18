"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RescheduleAppointmentDialog } from "@/components/patient/reschedule-appointment-dialog";

export function RescheduleAppointmentButton({
    appointmentId,
    psychologistName,
    currentDateTime,
    patientTimezone,
}: {
    appointmentId: string;
    psychologistName: string;
    currentDateTime: Date;
    patientTimezone: string | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                Reagendar
            </Button>
            <RescheduleAppointmentDialog
                appointmentId={appointmentId}
                psychologistName={psychologistName}
                currentDateTime={currentDateTime}
                patientTimezone={patientTimezone}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
