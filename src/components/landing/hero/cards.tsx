"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import Image from "next/image";
import type { BentoCard } from "./types";
import { CredentialBadges } from "./credential-badges";
import { FingerprintAnimation } from "./fingerprint-animation";
import { StepTimeline } from "./step-timeline";

export function PhotoCard({ card }: { card: BentoCard }) {
    if (card.type !== "photo") return null;
    return (
        <div className="relative h-full">
            <Image
                src={card.imgUrl}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-4 pt-10">
                <p className="text-base font-semibold text-white">{card.name}</p>
                <p className="text-sm text-white/80">{card.specialty}</p>
            </div>
        </div>
    );
}

export function ValueCard({ card }: { card: BentoCard }) {
    if (card.type !== "value") return null;
    const Icon = card.icon;
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, amount: 0.3 });

    return (
        <div
            ref={cardRef}
            className={`flex flex-col ${card.bg} p-5 h-full min-h-[140px] lg:min-h-[160px]`}
        >
            <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <Icon className="size-4 text-accent" />
                </div>
                <h3 className="text-base font-semibold font-sans">
                    {card.title}
                </h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
            </p>

            {/* Visual fill zone */}
            <div
                className={`relative hidden flex-1 overflow-hidden pt-2 2xl:flex ${
                    card.id === "value-2"
                        ? "-mx-5 items-center justify-center"
                        : "items-center justify-center"
                }`}
            >
                {card.id === "value-1" && (
                    <CredentialBadges animate={isInView} />
                )}
                {card.id === "value-2" && (
                    <FingerprintAnimation animate={isInView} />
                )}
                {card.id === "value-3" && <StepTimeline animate={isInView} />}
            </div>
        </div>
    );
}

export function DecorativeCard({ card }: { card: BentoCard }) {
    if (card.type !== "decorative") return null;
    return (
        <div
            className={`${card.bg} flex h-full min-h-[140px] items-center justify-center lg:min-h-[160px]`}
        >
            <Image
                src={card.supportImg}
                alt=""
                width={80}
                height={80}
                className="w-20 opacity-25"
                aria-hidden
            />
        </div>
    );
}
