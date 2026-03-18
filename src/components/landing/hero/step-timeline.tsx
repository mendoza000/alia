"use client";

import { motion } from "motion/react";
import { CalendarClock, ClipboardList, Check } from "lucide-react";
import { ease } from "@/lib/motion";

export function StepTimeline({ animate }: { animate: boolean }) {
    const steps = [
        {
            icon: CalendarClock,
            label: "Elige",
            circleDelay: 0.1,
            glowDelay: 0.2,
            iconDelay: 0.25,
        },
        {
            icon: ClipboardList,
            label: "Completa",
            circleDelay: 0.7,
            glowDelay: 0.8,
            iconDelay: 0.85,
        },
        {
            icon: Check,
            label: "Confirma",
            circleDelay: 1.3,
            glowDelay: 1.4,
            iconDelay: 1.45,
        },
    ];

    const lineDelays = [0.4, 1.0];

    return (
        <div className="flex w-full items-center justify-center">
            {steps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                    <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="relative">
                                {/* Glow ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-accent/40"
                                    initial={{ scale: 1, opacity: 0 }}
                                    animate={
                                        animate
                                            ? {
                                                  scale: [1, 1.6],
                                                  opacity: [0.5, 0],
                                              }
                                            : undefined
                                    }
                                    transition={{
                                        duration: 0.6,
                                        ease,
                                        delay: step.glowDelay,
                                    }}
                                />

                                {/* Main circle */}
                                <motion.div
                                    className="relative flex size-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20 sm:size-12 lg:size-16"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={
                                        animate
                                            ? i === 2
                                                ? {
                                                      scale: [0, 1.15, 1],
                                                      opacity: 1,
                                                  }
                                                : { scale: 1, opacity: 1 }
                                            : undefined
                                    }
                                    transition={{
                                        duration: i === 2 ? 0.5 : 0.4,
                                        ease,
                                        delay: step.circleDelay,
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={
                                            animate ? { scale: 1 } : undefined
                                        }
                                        transition={{
                                            duration: 0.3,
                                            ease,
                                            delay: step.iconDelay,
                                        }}
                                    >
                                        <StepIcon className="size-4 text-accent sm:size-5 lg:size-6" />
                                    </motion.div>
                                </motion.div>

                                {/* Completion sonar (step 3 only) */}
                                {i === 2 && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-accent"
                                        initial={{ scale: 1, opacity: 0 }}
                                        animate={
                                            animate
                                                ? {
                                                      scale: [1, 2.2],
                                                      opacity: [0.5, 0],
                                                  }
                                                : undefined
                                        }
                                        transition={{
                                            duration: 0.8,
                                            ease,
                                            delay: 1.4,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <motion.span
                                className="text-sm text-muted-foreground"
                                initial={{ opacity: 0, y: 6 }}
                                animate={
                                    animate ? { opacity: 1, y: 0 } : undefined
                                }
                                transition={{
                                    duration: 0.3,
                                    ease,
                                    delay: step.iconDelay,
                                }}
                            >
                                {step.label}
                            </motion.span>
                        </div>

                        {/* Connecting line */}
                        {i < 2 && (
                            <div className="relative mx-1.5 sm:mx-3 lg:mx-4">
                                {/* Background track */}
                                <div className="h-0.5 w-10 rounded-full bg-border/50 sm:w-14 lg:w-20" />

                                {/* Animated gradient fill */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 h-0.5 w-full origin-left rounded-full bg-gradient-to-r from-accent/60 to-accent/30"
                                    initial={{ scaleX: 0 }}
                                    animate={
                                        animate ? { scaleX: 1 } : undefined
                                    }
                                    transition={{
                                        duration: 0.35,
                                        ease,
                                        delay: lineDelays[i],
                                    }}
                                />

                                {/* Traveling dot */}
                                <motion.div
                                    className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_4px_rgba(234,172,167,0.5)]"
                                    initial={{ left: "0%", opacity: 0 }}
                                    animate={
                                        animate
                                            ? {
                                                  left: "100%",
                                                  opacity: [0, 1, 1, 0],
                                              }
                                            : undefined
                                    }
                                    transition={{
                                        duration: 0.35,
                                        ease,
                                        delay: lineDelays[i],
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
