import Script from "next/script";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID, GTM_ID } from "@/lib/analytics/gtag";
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
            {GTM_ID && (
                <Script id="gtm-init" strategy="afterInteractive">
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${GTM_ID}');
                    `}
                </Script>
            )}
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
