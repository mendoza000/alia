import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const kleinText = localFont({
  src: "../../public/fonts/Klein-Text-Book-trial.ttf",
  variable: "--font-sans",
  display: "swap",
});

const robechaDaniera = localFont({
  src: "../../public/fonts/Robecha Daniera-Regular.ttf",
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALIA - Tu psicólogo Aliado",
  description:
    "Plataforma de agendamiento de citas con psicólogos. Encuentra tu psicólogo aliado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${kleinText.variable} ${robechaDaniera.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
