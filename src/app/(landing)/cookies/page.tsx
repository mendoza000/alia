import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";
import { ManageCookiesTrigger } from "@/components/landing/manage-cookies-trigger";
import { CURRENT_COOKIES_POLICY_VERSION } from "@/lib/legal/cookies";
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
            <p className="text-xs text-muted-foreground">
                Versión {CURRENT_COOKIES_POLICY_VERSION} — Agosto 2026
            </p>

            <h2>1. ¿Qué son las cookies y tecnologías de seguimiento?</h2>
            <p>
                En aliabienestar.com (en adelante, la "Plataforma"), operada por
                Alia Coaching Services LLC, utilizamos cookies, etiquetas de
                conversión (pixels), balizas web (web beacons) y tecnologías
                similares de almacenamiento de datos.
            </p>
            <p>
                Una cookie es un pequeño archivo de texto que un sitio web
                almacena en el navegador o dispositivo del Usuario cuando navega
                por la Plataforma. Estas tecnologías permiten recordar las
                preferencias del Usuario, garantizar el funcionamiento seguro de
                los servicios de agendamiento y pago, analizar el rendimiento
                del sitio web y optimizar nuestras campañas de difusión y
                publicidad digital.
            </p>

            <h2>2. Clasificación y tipos de cookies utilizadas</h2>
            <p>
                Clasificamos las cookies utilizadas en nuestra Plataforma según
                su finalidad y procedencia:
            </p>

            <h3>A. Cookies estrictamente necesarias y técnicas (propias)</h3>
            <p>
                Son indispensables para permitir la navegación, el acceso a
                áreas seguras, la gestión de tu sesión y la ejecución fluida del
                proceso de agendamiento. No requieren tu consentimiento porque
                sin ellas la Plataforma no puede funcionar adecuadamente.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Finalidad</TableHead>
                        <TableHead>Duración</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>better-auth.session_token</TableCell>
                        <TableCell>Propia</TableCell>
                        <TableCell>
                            Mantener tu sesión iniciada como paciente o
                            administrador.
                        </TableCell>
                        <TableCell>Sesión</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>alia_cookie_consent</TableCell>
                        <TableCell>Propia</TableCell>
                        <TableCell>
                            Recordar tus preferencias de cookies.
                        </TableCell>
                        <TableCell>180 días</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h3>B. Cookies analíticas y de rendimiento (terceros)</h3>
            <p>
                Nos permiten cuantificar el número de visitantes, analizar cómo
                navegan los Usuarios por la Plataforma y medir el rendimiento
                del sitio para introducir mejoras operativas. Requieren tu
                consentimiento previo.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Finalidad</TableHead>
                        <TableHead>Duración</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>_ga, _ga_*</TableCell>
                        <TableCell>Google Analytics (GA4)</TableCell>
                        <TableCell>
                            Métricas estadísticas sobre el tráfico y uso de
                            aliabienestar.com, de forma agregada y
                            seudonimizada.
                        </TableCell>
                        <TableCell>Hasta 2 años</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h3>
                C. Cookies de publicidad, remarketing y conversión (terceros)
            </h3>
            <p>
                Se emplean para registrar el origen de las visitas derivadas de
                anuncios publicitarios, medir la efectividad de nuestras
                campañas de difusión y mostrar contenidos relevantes en
                plataformas externas según los intereses del Usuario, sin
                almacenar información médica ni diagnóstica. Requieren tu
                consentimiento previo.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Finalidad</TableHead>
                        <TableHead>Duración</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>_gcl_au</TableCell>
                        <TableCell>Google Ads</TableCell>
                        <TableCell>
                            Medir conversiones de campañas publicitarias.
                        </TableCell>
                        <TableCell>90 días</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>_fbp, _fbc</TableCell>
                        <TableCell>Meta Pixel (Facebook e Instagram)</TableCell>
                        <TableCell>
                            Medir conversiones y personalizar publicidad en
                            Meta.
                        </TableCell>
                        <TableCell>90 días</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <h2>3. Declaración de proveedores independientes (terceros)</h2>
            <p>
                El Usuario reconoce que ciertas tecnologías de seguimiento son
                gestionadas por proveedores externos sobre los cuales Alia
                Coaching Services LLC no ejerce un control técnico directo sobre
                su infraestructura interna. El uso de dichas tecnologías se rige
                por sus respectivas políticas de privacidad:
            </p>
            <ul>
                <li>
                    Google LLC (Google Analytics y Google Ads):{" "}
                    <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        policies.google.com/privacy
                    </a>
                </li>
                <li>
                    Meta Platforms, Inc. (Píxel y Meta Ads):{" "}
                    <a
                        href="https://www.facebook.com/about/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        facebook.com/about/privacy
                    </a>
                </li>
                <li>
                    Stripe, Inc. (Seguridad y Pagos):{" "}
                    <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        stripe.com/privacy
                    </a>
                </li>
            </ul>

            <h2>
                4. Gestión, control y desactivación de cookies por el Usuario
            </h2>
            <p>
                El Usuario mantiene en todo momento el derecho de configurar,
                limitar, rechazar o borrar el uso de cookies en su dispositivo.
            </p>

            <h3>A. Panel de preferencias en la Plataforma</h3>
            <p>
                Al acceder por primera vez a aliabienestar.com, se despliega un
                banner informativo que permite al Usuario aceptar, rechazar o
                personalizar la instalación de cookies analíticas y de
                publicidad. Puedes cambiar tu decisión en cualquier momento desde
                acá:
            </p>
            <ManageCookiesTrigger className="font-medium text-foreground" />

            <h3>B. Inhabilitación a través del navegador web</h3>
            <p>
                El Usuario puede modificar la configuración de su navegador para
                bloquear o ser notificado sobre la presencia de cookies:
            </p>
            <ul>
                <li>
                    Google Chrome: Configuración &gt; Privacidad y seguridad
                    &gt; Cookies y otros datos de sitios.
                </li>
                <li>Mozilla Firefox: Opciones &gt; Privacidad y seguridad.</li>
                <li>Apple Safari: Preferencias &gt; Privacidad.</li>
                <li>
                    Microsoft Edge: Configuración &gt; Permisos del sitio &gt;
                    Cookies.
                </li>
            </ul>

            <h3>C. Herramientas específicas de desactivación (opt-out)</h3>
            <ul>
                <li>
                    Google Analytics: puedes inhabilitar el rastreo instalando el
                    complemento de inhabilitación para navegadores de Google
                    Analytics.
                </li>
                <li>
                    Publicidad de Google: puedes gestionar la personalización de
                    anuncios en{" "}
                    <a
                        href="https://adssettings.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        adssettings.google.com
                    </a>
                    .
                </li>
            </ul>

            <h2>5. Modificaciones a la Política de Cookies</h2>
            <p>
                Alia Coaching Services LLC se reserva la facultad de actualizar
                la presente Política de Cookies para adaptarla a cambios
                técnicos, legales o de regulación de nuestros proveedores.
                Cualquier cambio significativo será notificado con un mínimo de
                quince (15) días de anticipación mediante aviso en la Plataforma
                o correo electrónico.
            </p>

            <h2>6. Canales oficiales de contacto</h2>
            <p>
                Para dudas, aclaraciones o consultas respecto a esta Política de
                Cookies o el tratamiento de datos en Alia Coaching Services LLC,
                el Usuario puede ponerse en contacto a través de nuestros
                canales oficiales:
            </p>
            <ul>
                <li>
                    Correo general e información:{" "}
                    <a href="mailto:contacto@aliabienestar.com">
                        contacto@aliabienestar.com
                    </a>
                </li>
                <li>
                    Soporte técnico y privacidad:{" "}
                    <a href="mailto:soporte@aliabienestar.com">
                        soporte@aliabienestar.com
                    </a>
                </li>
                <li>
                    Sitio web:{" "}
                    <a
                        href="https://aliabienestar.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        aliabienestar.com
                    </a>
                </li>
            </ul>
        </LegalPageLayout>
    );
}
