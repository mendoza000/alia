import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";
import { ManageCookiesTrigger } from "@/components/landing/manage-cookies-trigger";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
    title: "Política de Cookies | ALIA",
};

export default function CookiesPage() {
    return (
        <LegalPageLayout title="Política de Cookies">
            <p>
                Este contenido es un marcador de posición estructural. El texto
                definitivo de esta política será revisado y publicado por el
                equipo legal de ALIA. A continuación se detallan las cookies que
                utiliza actualmente el sitio.
            </p>

            <h2>Cookies estrictamente necesarias</h2>
            <p>
                No requieren tu consentimiento porque son indispensables para el
                funcionamiento del sitio.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Finalidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>better-auth.session_token</TableCell>
                        <TableCell>
                            Mantener tu sesión iniciada como paciente o
                            administrador.
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>alia_cookie_consent</TableCell>
                        <TableCell>
                            Recordar tus preferencias de cookies.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h2>Cookies de analítica</h2>
            <p>Requieren tu consentimiento previo.</p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Finalidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>_ga, _ga_*</TableCell>
                        <TableCell>Google Analytics</TableCell>
                        <TableCell>
                            Medir el uso y la navegación del sitio.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h2>Cookies de marketing y publicidad</h2>
            <p>Requieren tu consentimiento previo.</p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Finalidad</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>_gcl_au</TableCell>
                        <TableCell>Google Ads</TableCell>
                        <TableCell>
                            Medir conversiones de campañas publicitarias.
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>_fbp, _fbc</TableCell>
                        <TableCell>Meta Pixel</TableCell>
                        <TableCell>
                            Medir conversiones y personalizar publicidad en Meta
                            (Facebook e Instagram).
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h2>Gestionar mis preferencias</h2>
            <p>
                Podés cambiar tu decisión sobre las cookies de analítica y
                marketing en cualquier momento.
            </p>
            <ManageCookiesTrigger className="font-medium text-foreground" />
        </LegalPageLayout>
    );
}
