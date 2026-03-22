import type { Metadata } from "next";
import localFont from "next/font/local";
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={robechaDaniera.variable}>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
