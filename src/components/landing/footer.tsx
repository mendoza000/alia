import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import type { SiteSettings } from "@/lib/admin/site-settings-queries";
import { ManageCookiesTrigger } from "./manage-cookies-trigger";

const quickLinks = [
    { label: "Inicio", href: "/" },
    { label: "Psicólogos", href: "/#psicologos" },
    { label: "Agendar", href: "/agendar" },
    { label: "Preguntas frecuentes", href: "#faq" },
];

const legalLinks = [
    { label: "Política de Privacidad", href: "/privacidad" },
    { label: "Política de Cookies", href: "/cookies" },
    { label: "Términos y Condiciones", href: "/terminos" },
    { label: "Política de Reembolso y Cancelación", href: "/reembolso" },
    { label: "Consentimiento Informado", href: "/consentimiento-informado" },
];

export function Footer({ settings }: { settings: SiteSettings }) {
    return (
        <footer className="bg-primary text-primary-foreground">
            <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 lg:px-20 xl:px-28 xl:py-20">
                <div className="grid gap-12 md:grid-cols-3">
                    {/* Brand */}
                    <div>
                        <Image
                            src="/logo-alia-text-white.png"
                            alt="ALIA — Tu psicólogo Aliado"
                            width={120}
                            height={48}
                            className="h-10 w-auto xl:h-12"
                        />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-60 xl:text-base">
                            Conectamos personas con psicólogos profesionales
                            para acompañarte en tu bienestar emocional.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <p className="font-heading text-lg xl:text-xl">
                            Enlaces
                        </p>
                        <nav className="mt-4 flex flex-col gap-2">
                            {quickLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm opacity-60 transition-opacity hover:opacity-100 xl:text-base"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact */}
                    <div>
                        <p className="font-heading text-lg xl:text-xl">
                            Contacto
                        </p>
                        <div className="mt-4 flex flex-col gap-2 text-sm opacity-60 xl:text-base">
                            {settings.contactEmail && (
                                <a
                                    href={`mailto:${settings.contactEmail}`}
                                    className="transition-opacity hover:opacity-100"
                                >
                                    {settings.contactEmail}
                                </a>
                            )}
                            {settings.whatsappNumber && (
                                <a
                                    href={`https://wa.me/${settings.whatsappNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-opacity hover:opacity-100"
                                >
                                    WhatsApp
                                </a>
                            )}
                        </div>
                        {settings.instagramUrl && (
                            <div className="mt-4 flex gap-3">
                                <a
                                    href={settings.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="opacity-60 transition-opacity hover:opacity-100"
                                >
                                    <Instagram className="size-5" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="my-10 bg-primary-foreground/10" />

                <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed opacity-40">
                    Este servicio es de acompañamiento y bienestar emocional.
                    No constituye terapia psicológica clínica, diagnóstico
                    médico ni tratamiento psiquiátrico.
                </p>

                <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs opacity-50  xl:text-sm">
                    <p>
                        &copy; 2026 Alia Coaching Services LLC. Todos los
                        derechos reservados.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        {legalLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:opacity-100 hover:underline"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <ManageCookiesTrigger className="hover:opacity-100" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
