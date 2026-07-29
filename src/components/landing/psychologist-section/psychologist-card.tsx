"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ease } from "@/lib/motion";
import { formatCurrencyAmount } from "@/lib/currency";
import type { getActivePsychologists } from "@/lib/queries/psychologists";

type Psychologist = Awaited<ReturnType<typeof getActivePsychologists>>[number];

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PsychologistCard({
    psychologist,
    globalRate,
    index,
    inView,
}: {
    psychologist: Psychologist;
    globalRate: { amount: number; currency: string } | null;
    index: number;
    inView: boolean;
}) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
            animate={
                inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined
            }
            transition={{ duration: 0.8, ease, delay: index * 0.15 }}
            className="group relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-accent/30"
        >
            <Link
                href={`/psicologos/${psychologist.slug}`}
                className="absolute inset-0 z-0"
                aria-label={psychologist.name}
            />

            {/* Photo */}
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                {psychologist.photoUrl ? (
                    <Image
                        src={psychologist.photoUrl}
                        alt={psychologist.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="font-heading text-3xl text-muted-foreground">
                            {getInitials(psychologist.name)}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5">
                <span className="inline-block w-fit rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-muted-foreground">
                    {psychologist.specialty}
                </span>

                <span className="mt-2 font-heading text-lg font-bold transition-colors group-hover:text-accent font-sans">
                    {psychologist.name}
                </span>

                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {psychologist.bio}
                </p>

                {globalRate !== null && (
                    <p className="mt-3 text-sm font-semibold">
                        {formatCurrencyAmount(
                            globalRate.amount,
                            globalRate.currency,
                        )}{" "}
                        <span className="font-normal text-muted-foreground">
                            / sesión
                        </span>
                    </p>
                )}

                <Link
                    href={`/agendar/${psychologist.slug}`}
                    className="relative z-10 mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                >
                    Agendar sesión
                </Link>
            </div>
        </motion.article>
    );
}
