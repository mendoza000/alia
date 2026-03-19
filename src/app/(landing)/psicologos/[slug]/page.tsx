import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPsychologistBySlug } from "@/lib/queries/psychologists";
import { getFreeBusyPeriods } from "@/lib/google-calendar";
import { computeMonthAvailability } from "@/lib/availability";
import { TZDate } from "@date-fns/tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { ProfileContent } from "./profile-content";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo";

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
        title: psychologist.name,
        description,
        alternates: {
            canonical: `/psicologos/${slug}`,
        },
        openGraph: {
            type: "profile",
            title: `${psychologist.name} — ALIA`,
            description,
            ...(psychologist.photoUrl && {
                images: [{ url: psychologist.photoUrl }],
            }),
        },
        twitter: {
            card: "summary_large_image",
            title: `${psychologist.name} — ALIA`,
            description,
            ...(psychologist.photoUrl && {
                images: [psychologist.photoUrl],
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
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Person",
                    name: psychologist.name,
                    description: psychologist.bio,
                    ...(psychologist.photoUrl && {
                        image: psychologist.photoUrl,
                    }),
                    jobTitle: `Psicólogo${psychologist.specialty ? ` — ${psychologist.specialty}` : ""}`,
                    worksFor: {
                        "@type": "Organization",
                        name: siteConfig.name,
                    },
                }}
            />
            <ProfileContent
                psychologist={psychologist}
                initialAvailability={initialAvailability}
                initialYear={year}
                initialMonth={month}
            />
        </>
    );
}
