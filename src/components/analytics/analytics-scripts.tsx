import Script from "next/script";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from "@/lib/analytics/gtag";
import type { ConsentRecord } from "@/lib/consent/types";
import { MetaPixelScript } from "./meta-pixel-script";

export function AnalyticsScripts({
    initialConsent,
}: {
    initialConsent: ConsentRecord | null;
}) {
    const gtagIds = [GA_MEASUREMENT_ID, GOOGLE_ADS_ID].filter(
        (id): id is string => Boolean(id),
    );

    return (
        <>
            {gtagIds.length > 0 && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}`}
                        strategy="afterInteractive"
                    />
                    <Script id="gtag-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            ${gtagIds
                                .map(id =>
                                    id === GA_MEASUREMENT_ID
                                        ? `gtag('config', '${id}', { send_page_view: false });`
                                        : `gtag('config', '${id}');`,
                                )
                                .join("\n")}
                            window.gtag = gtag;
                        `}
                    </Script>
                </>
            )}
            <MetaPixelScript initialConsent={initialConsent} />
        </>
    );
}
