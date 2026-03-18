import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";

const quickLinks = [
    { label: "Inicio", href: "/" },
    { label: "Psicólogos", href: "/psicologos" },
    { label: "Agendar", href: "/agendar" },
    { label: "Preguntas frecuentes", href: "#faq" },
];

export function Footer() {
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
                            <a
                                href="mailto:contacto@alia.com.co"
                                className="transition-opacity hover:opacity-100"
                            >
                                contacto@alia.com.co
                            </a>
                            <a
                                href="https://wa.me/573001234567"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-100"
                            >
                                WhatsApp
                            </a>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="opacity-60 transition-opacity hover:opacity-100"
                            >
                                <Instagram className="size-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <Separator className="my-10 bg-primary-foreground/10" />

                <div className="flex flex-col items-center justify-between gap-4 text-xs opacity-50 sm:flex-row xl:text-sm">
                    <p>&copy; 2026 ALIA. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <Link href="/privacidad" className="hover:opacity-100">
                            Privacidad
                        </Link>
                        <Link href="/terminos" className="hover:opacity-100">
                            Términos
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
