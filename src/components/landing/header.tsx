"use client";

import { LogIn, Menu, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
    { label: "Inicio", href: "/" },
    { label: "Cómo funciona", href: "/#como-funciona" },
    { label: "Psicólogos", href: "/#psicologos" },
    { label: "Preguntas frecuentes", href: "/#faq" },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { data: session } = useSession();

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
                        className="h-14 w-auto lg:h-16"
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

                <div className="hidden items-center gap-4 md:flex">
                    {session?.user ? (
                        <Button
                            nativeButton={false}
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            render={<Link href="/mi-cuenta" />}
                        >
                            <User className="size-4" />
                            <span className="sr-only">Mi cuenta</span>
                        </Button>
                    ) : (
                        <Link
                            href="/iniciar-sesion"
                            className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Iniciar sesión
                        </Link>
                    )}
                    <Button
                        nativeButton={false}
                        className="rounded-full bg-accent px-5 text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                        render={<Link href="/agendar" />}
                    >
                        Agenda tu sesión
                    </Button>
                </div>

                {/* Mobile nav — the login/account affordance sits right next
                 * to the menu trigger instead of only inside the sheet, so
                 * it's reachable without opening the menu first. */}
                <div className="flex items-center gap-1 md:hidden">
                    <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon"
                        render={
                            <Link href={session?.user ? "/mi-cuenta" : "/iniciar-sesion"} />
                        }
                    >
                        {session?.user ? (
                            <User className="size-5" />
                        ) : (
                            <LogIn className="size-5" />
                        )}
                        <span className="sr-only">
                            {session?.user ? "Mi cuenta" : "Iniciar sesión"}
                        </span>
                    </Button>
                    <Sheet>
                        <SheetTrigger
                            render={<Button variant="ghost" size="icon" />}
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
                                    className="h-14 w-auto"
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
                                {session?.user ? (
                                    <SheetClose>
                                        <Link
                                            href="/mi-cuenta"
                                            className="flex items-center gap-2 text-base text-muted-foreground transition-all hover:text-foreground"
                                        >
                                            <User className="size-4" />
                                            Mi cuenta
                                        </Link>
                                    </SheetClose>
                                ) : (
                                    <SheetClose>
                                        <Link
                                            href="/iniciar-sesion"
                                            className="relative text-base text-muted-foreground transition-all hover:text-foreground"
                                        >
                                            Iniciar sesión
                                        </Link>
                                    </SheetClose>
                                )}
                                <Button
                                    nativeButton={false}
                                    className="mt-4 rounded-full bg-accent text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/80"
                                    render={<Link href="/agendar" />}
                                >
                                    Agenda tu sesión
                                </Button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
