import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPsychologistBySlug } from "@/lib/queries/psychologists";
import { getFreeBusyPeriods } from "@/lib/google-calendar";
import { computeMonthAvailability } from "@/lib/availability";
import { TZDate } from "@date-fns/tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { ProfileContent } from "./profile-content";

export const revalidate = 3600;

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) return {};

    const description = psychologist.bio.slice(0, 160);

    return {
        title: `${psychologist.name} — ALIA`,
        description,
        openGraph: {
            title: `${psychologist.name} — ALIA`,
            description,
            ...(psychologist.photoUrl && {
                images: [{ url: psychologist.photoUrl }],
            }),
        },
    };
}

export default async function PsychologistProfilePage({ params }: Props) {
    const { slug } = await params;
    const psychologist = await getPsychologistBySlug(slug);
    if (!psychologist) notFound();

    const now = new TZDate(new Date(), "America/Bogota");
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const firstDay = new TZDate(year, month - 1, 1, "America/Bogota");
    const timeMin = startOfMonth(firstDay);
    const timeMax = endOfMonth(firstDay);

    let busyPeriods: { start: Date; end: Date }[] = [];
    if (psychologist.calendarId) {
        busyPeriods = await getFreeBusyPeriods(
            psychologist.calendarId,
            timeMin,
            timeMax,
        );
    }

    const initialAvailability = computeMonthAvailability(
        psychologist.schedules,
        busyPeriods,
        year,
        month,
        psychologist.sessionDuration,
    );

    return (
        <ProfileContent
            psychologist={psychologist}
            initialAvailability={initialAvailability}
            initialYear={year}
            initialMonth={month}
        />
    );
}
