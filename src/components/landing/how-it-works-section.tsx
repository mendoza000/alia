"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
    CalendarCheck,
    ClipboardList,
    CreditCard,
    UserSearch,
} from "lucide-react";
import { ease } from "@/lib/motion";

const steps = [
    {
        icon: UserSearch,
        title: "Elige tu psicólogo",
        description:
            "Explora perfiles y encuentra al profesional ideal para ti.",
    },
    {
        icon: CalendarCheck,
        title: "Agenda tu cita",
        description: "Selecciona el horario que mejor se ajuste a tu rutina.",
    },
    {
        icon: ClipboardList,
        title: "Completa tu formulario",
        description: "Cuéntanos sobre ti para personalizar tu experiencia.",
    },
    {
        icon: CreditCard,
        title: "Realiza tu pago",
        description: "Pago seguro en línea. Recibe confirmación al instante.",
    },
];

export function HowItWorksSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.2 });

    return (
        <section
            id="como-funciona"
            className="relative overflow-hidden bg-card px-6 py-20 md:px-12 md:py-28 lg:px-20 xl:px-28 xl:py-36"
        >
            {/* Subtle radial gradient decoration */}
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,oklch(0.801_0.074_24.0/0.04),transparent_70%)]"
                aria-hidden
            />

            <div ref={sectionRef} className="relative mx-auto max-w-6xl">
                {/* Heading block */}
                <motion.div
                    className="mx-auto max-w-2xl text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.7, ease }}
                >
                    <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground xl:text-base">
                        Tu camino al bienestar
                    </span>
                    <h2 className="mt-2 font-heading text-3xl font-bold md:text-4xl xl:text-5xl">
                        Cómo funciona
                    </h2>
                    <p className="mt-4 text-muted-foreground xl:text-lg">
                        Agendar tu primera sesión es simple, seguro y solo toma
                        unos minutos.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative mt-14 flex flex-col items-center gap-2 sm:grid sm:grid-cols-2 sm:items-start sm:gap-8 lg:grid-cols-4">
                    {/* Animated gradient connector line (lg+ only) */}
                    <motion.div
                        className="pointer-events-none absolute top-10 right-[calc(12.5%+1rem)] left-[calc(12.5%+1rem)] hidden h-px bg-gradient-to-r from-border via-accent/40 to-border lg:block"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
                        transition={{ duration: 1.2, ease, delay: 0.5 }}
                        style={{ transformOrigin: "left" }}
                        aria-hidden
                    />

                    {steps.map((step, i) => (
                        <div key={step.title} className="contents">
                            {/* Mobile vertical connector (between cards) */}
                            {i > 0 && (
                                <div
                                    className="h-8 w-px bg-gradient-to-b from-border to-transparent sm:hidden"
                                    aria-hidden
                                />
                            )}

                            {/* Step card */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 50,
                                    filter: "blur(8px)",
                                }}
                                animate={
                                    inView
                                        ? {
                                              opacity: 1,
                                              y: 0,
                                              filter: "blur(0px)",
                                          }
                                        : undefined
                                }
                                transition={{
                                    duration: 0.8,
                                    ease,
                                    delay: i * 0.15,
                                }}
                                className="group relative flex w-full max-w-xs flex-col items-center rounded-lg bg-card px-5 pb-6 pt-8 text-center ring-1 ring-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-accent/30 sm:max-w-none"
                            >
                                {/* Step number pill */}
                                <span className="absolute -top-3 inline-flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                                    {i + 1}
                                </span>

                                {/* Icon */}
                                <motion.div
                                    className="flex size-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20 xl:size-[4.5rem]"
                                    initial={{ scale: 1 }}
                                    animate={
                                        inView
                                            ? { scale: [1, 1.15, 1] }
                                            : undefined
                                    }
                                    transition={{
                                        duration: 0.5,
                                        ease,
                                        delay: i * 0.15 + 0.4,
                                    }}
                                >
                                    <step.icon className="size-8 text-accent transition-transform duration-300 group-hover:scale-110 xl:size-9" />
                                </motion.div>

                                <h3 className="mt-4 font-semibold text-lg xl:text-lg font-sans">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground xl:text-md">
                                    {step.description}
                                </p>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
