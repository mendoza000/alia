import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPsychologistBySlug } from "@/lib/queries/psychologists";
import { getPublicDisplayRate } from "@/lib/admin/payment-rate-queries";
import { getCachedFreeBusyPeriods } from "@/lib/google-calendar";
import {
    appointmentsToBusyPeriods,
    computeMonthAvailability,
} from "@/lib/availability";
import { getBlockingAppointments } from "@/lib/queries/appointments";
import { TZDate } from "@date-fns/tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { ProfileContent } from "./profile-content";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo";

// Reading headers() below for geolocated pricing forces this route to render
// dynamically per request — the previous `revalidate = 3600` (ISR) no longer
// applies, since a statically cached page can't vary its price by visitor.

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

    const country = (await headers()).get("x-vercel-ip-country");
    const [calendarBusy, appointments, globalRate] = await Promise.all([
        psychologist.calendarId
            ? getCachedFreeBusyPeriods(
                  psychologist.calendarId,
                  timeMin,
                  timeMax,
              )
            : Promise.resolve([]),
        getBlockingAppointments(psychologist.id, timeMin, timeMax),
        getPublicDisplayRate(country),
    ]);

    const allBusyPeriods = [
        ...calendarBusy,
        ...appointmentsToBusyPeriods(appointments),
    ];

    const initialAvailability = computeMonthAvailability(
        psychologist.schedules,
        allBusyPeriods,
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
                globalRate={globalRate}
                initialAvailability={initialAvailability}
                initialYear={year}
                initialMonth={month}
            />
        </>
    );
}
