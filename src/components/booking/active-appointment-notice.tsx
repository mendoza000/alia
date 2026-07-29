import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { CalendarClockIcon } from "lucide-react";

type ActiveAppointmentNoticeProps = {
    psychologistName: string;
    dateTime: Date;
};

export function ActiveAppointmentNotice({
    psychologistName,
    dateTime,
}: ActiveAppointmentNoticeProps) {
    const dateTimeInBogota = new TZDate(dateTime, "America/Bogota");
    const formattedDate = format(
        dateTimeInBogota,
        "EEEE d 'de' MMMM, yyyy — HH:mm",
        { locale: es },
    );

    return (
        <div className="mx-auto max-w-md rounded-lg bg-card p-8 text-center ring-1 ring-border/50">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary">
                <CalendarClockIcon className="size-8 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-2xl font-bold">
                Ya tienes una sesión activa
            </h2>
            <p className="mt-2 text-muted-foreground">
                Solo puedes tener una sesión pendiente o confirmada a la vez.
            </p>
            <div className="mt-4 rounded-md bg-secondary/50 p-4 text-sm">
                <p className="font-medium">{psychologistName}</p>
                <p className="capitalize text-muted-foreground">
                    {formattedDate}
                </p>
            </div>
            <Link
                href="/mi-cuenta/citas"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
            >
                Ver mis sesiones
            </Link>
        </div>
    );
}
