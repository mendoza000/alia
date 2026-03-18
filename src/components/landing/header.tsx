"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
    { label: "Inicio", href: "#" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Preguntas frecuentes", href: "#faq" },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 16);
        }
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-accent ${
                scrolled
                    ? "h-16 border-b border-border/40 bg-card/90 shadow-sm backdrop-blur-md lg:h-20"
                    : "h-20 border-b border-transparent bg-transparent lg:h-24"
            }`}
        >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-12 lg:px-20 xl:px-28">
                <Link href="/" className="-my-2">
                    <Image
                        src="/logo-alia.png"
                        alt="ALIA — Tu psicólogo Aliado"
                        width={160}
                        height={160}
                        className="h-12 w-auto lg:h-14"
                    />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-8 md:flex">
                    {navLinks.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="relative text-sm tracking-wide text-muted-foreground transition-all hover:-translate-y-px hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden md:block">
                    <Button
                        nativeButton={false}
                        className="rounded-full bg-accent px-5 text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                        render={<Link href="/agendar" />}
                    >
                        Agenda tu cita
                    </Button>
                </div>

                {/* Mobile nav */}
                <Sheet>
                    <SheetTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                            />
                        }
                    >
                        <Menu className="size-5" />
                        <span className="sr-only">Menú</span>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 p-6">
                        <SheetTitle>
                            <Image
                                src="/logo-alia.png"
                                alt="ALIA"
                                width={120}
                                height={120}
                                className="h-10 w-auto"
                            />
                        </SheetTitle>
                        <nav className="mt-8 flex flex-col gap-4 border-t border-accent/20 pt-6">
                            {navLinks.map(link => (
                                <SheetClose key={link.href}>
                                    <a
                                        href={link.href}
                                        className="relative text-base text-muted-foreground transition-all hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                                    >
                                        {link.label}
                                    </a>
                                </SheetClose>
                            ))}
                            <Button
                                nativeButton={false}
                                className="mt-4 rounded-full bg-accent text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                                render={<Link href="/agendar" />}
                            >
                                Agenda tu cita
                            </Button>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
