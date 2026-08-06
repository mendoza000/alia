"use client";

import { cn } from "@/lib/utils";
import { REOPEN_CONSENT_BANNER_EVENT } from "@/lib/consent/consent-store";

export function ManageCookiesTrigger({ className }: { className?: string }) {
    return (
        <button
            type="button"
            onClick={() =>
                window.dispatchEvent(
                    new CustomEvent(REOPEN_CONSENT_BANNER_EVENT),
                )
            }
            className={cn(
                "text-left hover:opacity-100 hover:underline",
                className,
            )}
        >
            Gestionar preferencias de cookies
        </button>
    );
}
