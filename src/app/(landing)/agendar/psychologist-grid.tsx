"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { PsychologistCard } from "@/components/landing/psychologist-section/psychologist-card";
import type { getActivePsychologists } from "@/lib/queries/psychologists";

type Psychologist = Awaited<ReturnType<typeof getActivePsychologists>>[number];

export function PsychologistGrid({
    psychologists,
}: {
    psychologists: Psychologist[];
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <div
            ref={ref}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
            {psychologists.map((psychologist, i) => (
                <PsychologistCard
                    key={psychologist.id}
                    psychologist={psychologist}
                    index={i}
                    inView={inView}
                />
            ))}
        </div>
    );
}
