"use client";

import { motion } from "motion/react";
import { ease } from "@/lib/motion";

const fingerprintPaths = [
    "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
    "M14 13.12c0 2.38 0 6.38-1 8.88",
    "M17.29 21.02c.12-.6.43-2.3.5-3.02",
    "M2 12a10 10 0 0 1 18-6",
    "M2 16h.01",
    "M21.8 16c.2-2 .131-5.354 0-6",
    "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
    "M8.65 22c.21-.66.45-1.32.57-2",
    "M9 6.8a6 6 0 0 1 9 5.2v2",
];

export function FingerprintAnimation({ animate }: { animate: boolean }) {
    return (
        <div className="relative flex w-full items-end justify-center">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-32 h-32 text-accent lg:w-40 lg:h-40"
            >
                {fingerprintPaths.map((d, i) => (
                    <motion.path
                        key={i}
                        d={d}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            animate ? { pathLength: 1, opacity: 1 } : undefined
                        }
                        transition={{
                            pathLength: { duration: 0.6, ease, delay: i * 0.1 },
                            opacity: { duration: 0.1, delay: i * 0.1 },
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}
