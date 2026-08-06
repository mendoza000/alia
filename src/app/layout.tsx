import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConsentModeScript } from "@/components/analytics/consent-mode-script";
import { getConsentFromCookies } from "@/lib/consent/server";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

const robechaDaniera = localFont({
    src: "../../public/fonts/Robecha Daniera-Regular.ttf",
    variable: "--font-heading",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.title,
        template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
        type: "website",
        locale: siteConfig.locale,
        siteName: siteConfig.name,
    },
    twitter: {
        card: "summary_large_image",
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const initialConsent = await getConsentFromCookies();

    return (
        <html lang="es" className={robechaDaniera.variable}>
            <body className="antialiased">
                <ConsentModeScript initialConsent={initialConsent} />
                {children}
            </body>
        </html>
    );
}
