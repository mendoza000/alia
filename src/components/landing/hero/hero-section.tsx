"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";
import { bentoCards, avatarGradients } from "./data";
import { PhotoCard, ValueCard, DecorativeCard } from "./cards";

export function HeroSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.15 });

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden px-6 py-20 pt-28 md:px-12 lg:grid lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-12 lg:px-20 xl:gap-16 xl:px-28"
        >
            {/* Background decoration */}
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent)/0.06,transparent_70%)]"
                aria-hidden
            />

            {/* Left side — Text content */}
            <div className="relative z-10 mb-12 lg:mb-0">
                <motion.span
                    className="text-sm uppercase font-semibold tracking-widest text-muted-foreground xl:text-base"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.6, ease, delay: 0 }}
                >
                    Tu psicólogo Aliado
                </motion.span>

                <motion.h1
                    className="mt-3 font-heading font-bold text-4xl leading-tight md:text-5xl xl:text-6xl"
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.7, ease, delay: 0.1 }}
                >
                    Tu bienestar emocional merece atención profesional
                </motion.h1>

                <motion.p
                    className="mt-5 max-w-lg text-lg text-muted-foreground md:text-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.6, ease, delay: 0.2 }}
                >
                    Agenda tu cita con psicólogos verificados. Un espacio
                    seguro, confidencial y pensado para ti.
                </motion.p>

                <motion.div
                    className="mt-8 flex flex-col gap-4 sm:flex-row"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={
                        inView ? { opacity: 1, y: 0, scale: 1 } : undefined
                    }
                    transition={{ duration: 0.5, ease, delay: 0.35 }}
                >
                    <Button
                        className="h-11 rounded-xl bg-accent px-6 text-base text-accent-foreground hover:bg-accent/80 xl:h-12 xl:px-8 xl:text-lg"
                        render={<Link href="/agendar" />}
                    >
                        Agenda tu cita
                    </Button>
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl px-6 text-base xl:h-12 xl:px-8 xl:text-lg"
                        render={<Link href="/psicologos" />}
                    >
                        Conoce a nuestros psicólogos
                    </Button>
                </motion.div>

                {/* Avatar stack — social proof */}
                <motion.div
                    className="mt-8 flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : undefined}
                    transition={{ duration: 0.5, ease, delay: 0.45 }}
                >
                    <div className="flex -space-x-3">
                        {avatarGradients.map((gradient, i) => (
                            <div
                                key={i}
                                className={`size-9 rounded-full ring-2 ring-background ${gradient}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        100+ pacientes confían en nosotros
                    </p>
                </motion.div>
            </div>

            {/* Right side — Bento grid */}
            <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-[1fr_1fr_1fr] lg:h-[calc(100svh-12rem)] xl:gap-3.5">
                {bentoCards.map((card, i) => (
                    <motion.div
                        key={card.id}
                        className={`${card.className} rounded-xl ring-1 ring-border/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-accent/30`}
                        initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                        animate={
                            inView
                                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                                : undefined
                        }
                        transition={{
                            duration: 0.7,
                            ease,
                            delay: 0.3 + i * 0.1,
                        }}
                    >
                        {card.type === "photo" && <PhotoCard card={card} />}
                        {card.type === "value" && <ValueCard card={card} />}
                        {card.type === "decorative" && (
                            <DecorativeCard card={card} />
                        )}
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
