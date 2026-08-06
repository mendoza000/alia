"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
    REOPEN_CONSENT_BANNER_EVENT,
    setConsent,
} from "@/lib/consent/consent-store";
import type { ConsentRecord } from "@/lib/consent/types";

export function CookieConsentBanner({
    initialConsent,
}: {
    initialConsent: ConsentRecord | null;
}) {
    const [bannerOpen, setBannerOpen] = useState(initialConsent === null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [analyticsChecked, setAnalyticsChecked] = useState(
        initialConsent?.analytics ?? false,
    );
    const [marketingChecked, setMarketingChecked] = useState(
        initialConsent?.marketing ?? false,
    );

    useEffect(() => {
        function onReopen() {
            setDialogOpen(true);
        }

        window.addEventListener(REOPEN_CONSENT_BANNER_EVENT, onReopen);
        return () =>
            window.removeEventListener(REOPEN_CONSENT_BANNER_EVENT, onReopen);
    }, []);

    function acceptAll() {
        setConsent({ necessary: true, analytics: true, marketing: true });
        setAnalyticsChecked(true);
        setMarketingChecked(true);
        setBannerOpen(false);
        setDialogOpen(false);
    }

    function rejectNonEssential() {
        setConsent({ necessary: true, analytics: false, marketing: false });
        setAnalyticsChecked(false);
        setMarketingChecked(false);
        setBannerOpen(false);
        setDialogOpen(false);
    }

    function savePreferences() {
        setConsent({
            necessary: true,
            analytics: analyticsChecked,
            marketing: marketingChecked,
        });
        setBannerOpen(false);
        setDialogOpen(false);
    }

    return (
        <>
            {bannerOpen && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-4 shadow-sm sm:p-6">
                    <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-heading text-lg">
                                Usamos cookies
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Usamos cookies necesarias para el funcionamiento
                                del sitio y, con tu permiso, cookies de
                                analítica y marketing. Podés revisar los
                                detalles en nuestra{" "}
                                <a
                                    href="/cookies"
                                    className="underline hover:text-foreground"
                                >
                                    Política de Cookies
                                </a>
                                .
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={rejectNonEssential}
                            >
                                Rechazar no esenciales
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDialogOpen(true)}
                            >
                                Personalizar
                            </Button>
                            <Button onClick={acceptAll}>Aceptar todas</Button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Preferencias de cookies</DialogTitle>
                        <DialogDescription>
                            Elegí qué categorías de cookies querés permitir.
                            Podés cambiar esta decisión en cualquier momento
                            desde el pie de página.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">
                                    Necesarias
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Requeridas para mantener tu sesión iniciada.
                                    No se pueden desactivar.
                                </p>
                            </div>
                            <Switch checked disabled />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">Analítica</p>
                                <p className="text-sm text-muted-foreground">
                                    Nos ayudan a entender cómo se usa el sitio
                                    (Google Analytics).
                                </p>
                            </div>
                            <Switch
                                checked={analyticsChecked}
                                onCheckedChange={setAnalyticsChecked}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">Marketing</p>
                                <p className="text-sm text-muted-foreground">
                                    Usadas para medir y personalizar publicidad
                                    (Google Ads y Meta Pixel).
                                </p>
                            </div>
                            <Switch
                                checked={marketingChecked}
                                onCheckedChange={setMarketingChecked}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={acceptAll}>
                            Aceptar todas
                        </Button>
                        <Button onClick={savePreferences}>
                            Guardar preferencias
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
