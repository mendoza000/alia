import Script from "next/script";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from "@/lib/analytics/gtag";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";

export function AnalyticsScripts() {
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
            {META_PIXEL_ID && (
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
            )}
        </>
    );
}
