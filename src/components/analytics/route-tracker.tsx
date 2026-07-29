"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gtagEvent } from "@/lib/analytics/gtag";
import { fbqTrack } from "@/lib/analytics/meta-pixel";

function RouteTrackerInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams.toString();
        const path = query ? `${pathname}?${query}` : pathname;

        gtagEvent("page_view", { page_path: path });
        fbqTrack("PageView");
    }, [pathname, searchParams]);

    return null;
}

export function RouteTracker() {
    return (
        <Suspense fallback={null}>
            <RouteTrackerInner />
        </Suspense>
    );
}
