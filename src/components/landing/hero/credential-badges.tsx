"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { ease } from "@/lib/motion";

export function CredentialBadges({ animate }: { animate: boolean }) {
    const credentials = [
        { rotate: -2, delay: 0.1, floatDuration: 3.2 },
        { rotate: 0, delay: 0.25, floatDuration: 2.8 },
        { rotate: 2, delay: 0.4, floatDuration: 3.6 },
    ];

    return (
        <div className="flex items-end gap-3 lg:gap-4">
            {credentials.map((cred, i) => (
                <motion.div
                    key={i}
                    className={`relative flex w-32 flex-col gap-1.5 rounded-lg bg-background p-3 ring-1 ring-border/40 sm:w-36 sm:p-3.5 lg:w-44 lg:p-5 ${i === 2 ? "hidden sm:flex" : ""}`}
                    initial={{ opacity: 0, y: 30, rotate: 0, scale: 0.85 }}
                    animate={
                        animate
                            ? {
                                  opacity: 1,
                                  y: [0, -3, 0],
                                  rotate: cred.rotate,
                                  scale: 1,
                              }
                            : undefined
                    }
                    transition={{
                        opacity: { duration: 0.5, delay: cred.delay },
                        y: {
                            delay: cred.delay + 0.7,
                            duration: cred.floatDuration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        },
                        rotate: {
                            type: "spring",
                            stiffness: 120,
                            damping: 14,
                            delay: cred.delay,
                        },
                        scale: {
                            type: "spring",
                            stiffness: 120,
                            damping: 14,
                            delay: cred.delay,
                        },
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div className="size-8 shrink-0 rounded-full bg-secondary/80 lg:size-9" />
                        <div className="flex flex-1 flex-col gap-1.5">
                            <motion.div
                                className="h-2 rounded-full bg-secondary/60"
                                initial={{ width: 0 }}
                                animate={
                                    animate ? { width: "100%" } : undefined
                                }
                                transition={{
                                    duration: 0.5,
                                    ease,
                                    delay: cred.delay + 0.4,
                                }}
                            />
                            <motion.div
                                className="h-2 rounded-full bg-secondary/40"
                                initial={{ width: 0 }}
                                animate={animate ? { width: "75%" } : undefined}
                                transition={{
                                    duration: 0.5,
                                    ease,
                                    delay: cred.delay + 0.5,
                                }}
                            />
                        </div>
                    </div>
                    <motion.div
                        className="h-2 rounded-full bg-secondary/30"
                        initial={{ width: 0 }}
                        animate={animate ? { width: "100%" } : undefined}
                        transition={{
                            duration: 0.5,
                            ease,
                            delay: cred.delay + 0.55,
                        }}
                    />
                    {/* Check badge: on card 1 (mobile) and card 2 (sm+) */}
                    {(i === 1 || i === 2) && (
                        <motion.div
                            className={`absolute -right-1 -top-1 size-7 items-center justify-center rounded-full bg-accent ${i === 1 ? "flex sm:hidden" : "hidden sm:flex"}`}
                            initial={{ scale: 0 }}
                            animate={
                                animate
                                    ? {
                                          scale: 1,
                                          boxShadow: [
                                              "0 0 0 0px rgba(234,172,167,0.5)",
                                              "0 0 0 8px rgba(234,172,167,0)",
                                          ],
                                      }
                                    : undefined
                            }
                            transition={{
                                scale: {
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 10,
                                    delay: 0.75,
                                },
                                boxShadow: {
                                    duration: 0.8,
                                    delay: 0.9,
                                    ease: "easeOut",
                                },
                            }}
                        >
                            <Check className="size-3.5 text-accent-foreground" />
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
