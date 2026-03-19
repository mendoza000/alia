"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ease } from "@/lib/motion";
import type { Psychologist, Schedule } from "@/generated/prisma/client";
import type { MonthAvailability } from "@/lib/availability";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";

const currencyFormat = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ProfileContentProps = {
    psychologist: Psychologist & { schedules: Schedule[] };
    initialAvailability: MonthAvailability;
    initialYear: number;
    initialMonth: number;
};

export function ProfileContent({
    psychologist,
    initialAvailability,
    initialYear,
    initialMonth,
}: ProfileContentProps) {
    const bioRef = useRef<HTMLDivElement>(null);
    const bioInView = useInView(bioRef, { once: true, amount: 0.2 });
    const scheduleRef = useRef<HTMLDivElement>(null);
    const scheduleInView = useInView(scheduleRef, { once: true, amount: 0.2 });

    return (
        <div className="px-6 pb-20 pt-28 md:px-12 md:pb-28 md:pt-36 lg:px-20 xl:px-28">
            <div className="mx-auto max-w-5xl">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm text-muted-foreground">
                    <Link
                        href="/"
                        className="transition-colors hover:text-foreground"
                    >
                        Inicio
                    </Link>
                    <span className="mx-2">/</span>
                    <Link
                        href="/#psicologos"
                        className="transition-colors hover:text-foreground"
                    >
                        Psicólogos
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{psychologist.name}</span>
                </nav>

                {/* Hero: Photo + Info */}
                <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-start">
                    {/* Photo */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease }}
                        className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary"
                    >
                        {psychologist.photoUrl ? (
                            <Image
                                src={psychologist.photoUrl}
                                alt={psychologist.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 40vw"
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="font-heading text-5xl text-muted-foreground">
                                    {getInitials(psychologist.name)}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* Info */}
                    <div className="flex flex-col gap-4">
                        {[
                            <span
                                key="badge"
                                className="inline-block w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                                {psychologist.specialty}
                            </span>,
                            <h1
                                key="name"
                                className="font-heading text-3xl font-bold md:text-4xl xl:text-5xl"
                            >
                                {psychologist.name}
                            </h1>,
                            <div
                                key="rate"
                                className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
                            >
                                <span className="text-lg font-semibold">
                                    {currencyFormat.format(
                                        psychologist.sessionRate,
                                    )}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / sesión de {psychologist.sessionDuration}{" "}
                                    min
                                </span>
                            </div>,
                            <h2 className="font-heading text-2xl font-bold mt-4">
                                Sobre mí
                            </h2>,
                            <div className="mb-4 space-y-4 text-muted-foreground leading-relaxed">
                                {psychologist.bio
                                    .split("\n")
                                    .filter(Boolean)
                                    .map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))}
                            </div>,
                            <Link
                                key="cta"
                                href={`/agendar/${psychologist.slug}`}
                                className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-accent px-8 py-3 font-medium text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                            >
                                Agendar cita
                            </Link>,
                        ].map((element, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    ease,
                                    delay: 0.2 + i * 0.1,
                                }}
                            >
                                {element}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bio */}
                <motion.div
                    ref={bioRef}
                    initial={{ opacity: 0, y: 30 }}
                    animate={bioInView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.7, ease }}
                    className="mt-16"
                ></motion.div>

                {/* Availability Calendar */}
                {psychologist.schedules.length > 0 && (
                    <div ref={scheduleRef} className="mt-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={
                                scheduleInView
                                    ? { opacity: 1, y: 0 }
                                    : undefined
                            }
                            transition={{ duration: 0.6, ease }}
                        >
                            <h2 className="font-heading text-2xl font-bold">
                                Disponibilidad
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Selecciona un día para ver los horarios
                                disponibles.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={
                                scheduleInView
                                    ? { opacity: 1, y: 0 }
                                    : undefined
                            }
                            transition={{ duration: 0.6, ease, delay: 0.15 }}
                            className="mt-6"
                        >
                            <AvailabilityCalendar
                                psychologistId={psychologist.id}
                                psychologistSlug={psychologist.slug}
                                schedules={psychologist.schedules}
                                sessionDuration={psychologist.sessionDuration}
                                initialAvailability={initialAvailability}
                                initialYear={initialYear}
                                initialMonth={initialMonth}
                            />
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
