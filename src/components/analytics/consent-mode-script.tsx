import Script from "next/script";
import { DEFAULT_DENIED } from "@/lib/consent/consent-cookie";
import type { ConsentRecord } from "@/lib/consent/types";

function storageValue(granted: boolean) {
    return granted ? "granted" : "denied";
}

export function ConsentModeScript({
    initialConsent,
}: {
    initialConsent: ConsentRecord | null;
}) {
    const categories = initialConsent ?? DEFAULT_DENIED;

    return (
        <Script id="consent-default" strategy="beforeInteractive">
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('consent', 'default', {
                    ad_storage: '${storageValue(categories.marketing)}',
                    analytics_storage: '${storageValue(categories.analytics)}',
                    ad_user_data: '${storageValue(categories.marketing)}',
                    ad_personalization: '${storageValue(categories.marketing)}',
                    wait_for_update: 500
                });
            `}
        </Script>
    );
}
