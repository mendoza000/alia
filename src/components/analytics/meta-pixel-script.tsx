"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_UPDATED_EVENT } from "@/lib/consent/consent-store";
import type { ConsentCategories, ConsentRecord } from "@/lib/consent/types";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";

export function MetaPixelScript({
    initialConsent,
}: {
    initialConsent: ConsentRecord | null;
}) {
    const [marketingGranted, setMarketingGranted] = useState(
        initialConsent?.marketing ?? false,
    );

    useEffect(() => {
        function onConsentUpdated(event: Event) {
            const categories = (event as CustomEvent<ConsentCategories>).detail;
            setMarketingGranted(categories.marketing);
        }

        window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
        return () =>
            window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
    }, []);

    if (!META_PIXEL_ID || !marketingGranted) return null;

    return (
        <>
            <Script id="meta-pixel-init" strategy="afterInteractive">
                {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${META_PIXEL_ID}');
                `}
            </Script>
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    );
}
