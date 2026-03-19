"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ease } from "@/lib/motion";
import { PsychologistCard } from "./psychologist-card";
import type { getActivePsychologists } from "@/lib/queries/psychologists";

type Psychologist = Awaited<ReturnType<typeof getActivePsychologists>>[number];

export function PsychologistSectionClient({
    psychologists,
}: {
    psychologists: Psychologist[];
}) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.15 });

    return (
        <section
            id="psicologos"
            className="relative overflow-hidden bg-background px-6 py-20 md:px-12 md:py-28 lg:px-20 xl:px-28 xl:py-36"
        >
            {/* Subtle radial gradient decoration */}
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.801_0.074_24.0/0.04),transparent_70%)]"
                aria-hidden
            />

            <div ref={sectionRef} className="relative mx-auto max-w-6xl">
                {/* Heading */}
                <motion.div
                    className="mx-auto max-w-2xl text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.7, ease }}
                >
                    <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground xl:text-base">
                        Profesionales a tu alcance
                    </span>
                    <h2 className="mt-2 font-heading text-3xl font-bold md:text-4xl xl:text-5xl">
                        Conoce a nuestros psicólogos
                    </h2>
                    <p className="mt-4 text-muted-foreground xl:text-lg">
                        Cada profesional está comprometido con tu bienestar
                        emocional. Encuentra al indicado para ti.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {psychologists.map((psychologist, i) => (
                        <PsychologistCard
                            key={psychologist.id}
                            psychologist={psychologist}
                            index={i}
                            inView={inView}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
