"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CONSENT_UPDATED_EVENT } from "@/lib/consent/consent-store";
import type { ConsentRecord } from "@/lib/consent/types";

const BUBBLE_SHOW_DELAY_MS = 800;
const BUBBLE_VISIBLE_MS = 6000;

export function WhatsAppButton({
    whatsappNumber,
    initialConsent,
}: {
    whatsappNumber: string | null;
    initialConsent: ConsentRecord | null;
}) {
    const [showBubble, setShowBubble] = useState(false);
    const [hiddenByBanner, setHiddenByBanner] = useState(
        initialConsent === null,
    );

    useEffect(() => {
        if (!whatsappNumber) return;
        const showTimer = setTimeout(
            () => setShowBubble(true),
            BUBBLE_SHOW_DELAY_MS,
        );
        const hideTimer = setTimeout(
            () => setShowBubble(false),
            BUBBLE_SHOW_DELAY_MS + BUBBLE_VISIBLE_MS,
        );
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [whatsappNumber]);

    useEffect(() => {
        function onConsentUpdated() {
            setHiddenByBanner(false);
        }

        window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
        return () =>
            window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
    }, []);

    if (!whatsappNumber) return null;

    return (
        <div
            className={`fixed right-5 bottom-5 z-30 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6 ${
                hiddenByBanner ? "invisible" : ""
            }`}
            aria-hidden={hiddenByBanner}
        >

            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="max-w-56 rounded-lg bg-card px-3 py-2 text-sm text-foreground shadow-lg ring-1 ring-border/50"
                    >
                        ¿Necesitas ayuda? Pídesela a Jeff
                    </motion.div>
                )}
            </AnimatePresence>

            <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escríbenos por WhatsApp"
                className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-7"
                    aria-hidden="true"
                >
                    <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.96 9.96 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-10-10.01-10Zm5.87 14.24c-.25.7-1.24 1.29-1.98 1.44-.5.1-1.15.18-3.35-.72-2.82-1.16-4.63-4.01-4.77-4.2-.14-.19-1.14-1.51-1.14-2.88 0-1.37.72-2.04.97-2.32.25-.28.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.27-.12.53.16.26.71 1.19 1.53 1.93 1.05.95 1.94 1.25 2.2 1.39.26.14.42.12.57-.07.16-.19.66-.78.84-1.05.18-.26.35-.22.6-.13.25.09 1.58.76 1.85.9.27.14.45.21.51.32.07.12.07.68-.18 1.38Z" />
                </svg>
            </a>
        </div>
    );
}
