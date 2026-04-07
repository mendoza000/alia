"use client";

import { motion } from "motion/react";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STEPS = [
    { label: "Psicólogo" },
    { label: "Horario" },
    { label: "Formulario" },
    { label: "Pago" },
];

export function BookingStepper({ currentStep }: { currentStep: number }) {
    return (
        <nav aria-label="Progreso de agendamiento" className="mb-8 sm:mb-10">
            <ol className="flex items-center justify-center gap-0">
                {STEPS.map((step, i) => {
                    const stepNumber = i + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isFuture = stepNumber > currentStep;

                    return (
                        <li
                            key={step.label}
                            className="flex items-center last:flex-none"
                        >
                            {/* Step circle + label */}
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <motion.div
                                        className={cn(
                                            "relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:size-9 sm:text-sm",
                                            isCompleted &&
                                                "bg-accent text-accent-foreground",
                                            isCurrent &&
                                                "bg-accent text-accent-foreground ring-2 ring-accent/30 ring-offset-2 ring-offset-background",
                                            isFuture &&
                                                "bg-muted text-muted-foreground",
                                        )}
                                        initial={false}
                                        animate={{
                                            scale: isCurrent ? 1.1 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                    >
                                        {isCompleted ? (
                                            <motion.svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="size-4 sm:size-5"
                                                initial={{
                                                    scale: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease,
                                                }}
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                                    clipRule="evenodd"
                                                />
                                            </motion.svg>
                                        ) : (
                                            <span>{stepNumber}</span>
                                        )}
                                    </motion.div>

                                    {/* Pulse ring for current step */}
                                    {isCurrent && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-accent/20"
                                            initial={{ scale: 1, opacity: 0.5 }}
                                            animate={{
                                                scale: [1, 1.6, 1.6],
                                                opacity: [0.4, 0, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeOut",
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={cn(
                                        "mt-1.5 text-[10px] font-medium sm:text-xs",
                                        isCurrent
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div className="relative mx-1.5 h-0.5 w-8 sm:mx-3 sm:w-16 self-start mt-[15px] sm:mt-[17px]">
                                    {/* Background line */}
                                    <div className="absolute inset-0 rounded-full bg-muted" />
                                    {/* Fill line */}
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                                        initial={false}
                                        animate={{
                                            width: isCompleted ? "100%" : "0%",
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            ease,
                                        }}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
