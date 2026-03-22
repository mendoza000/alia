"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import { ease } from "@/lib/motion";

export function AnimatedCard({
	children,
	delay = 0,
}: { children: ReactNode; delay?: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{ duration: 0.5, ease, delay }}
		>
			{children}
		</motion.div>
	);
}
