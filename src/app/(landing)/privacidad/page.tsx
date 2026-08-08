import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/lib/legal/privacy";

export const metadata: Metadata = {
    title: "Política de Privacidad | ALIA",
};

export default function PrivacidadPage() {
    return (
        <LegalPageLayout title="Política de Privacidad">
            <p className="text-xs text-muted-foreground">
                Versión {CURRENT_PRIVACY_POLICY_VERSION} — Consolidada
                Definitiva (2026)
            </p>

            <ul>
                <li>
                    <strong>Entidad titular (responsable):</strong> Alia
                    Coaching Services LLC
                </li>
                <li>
                    <strong>Forma jurídica:</strong> Limited Liability Company
                    (Wyoming, EE. UU.)
                </li>
                <li>
                    <strong>Domicilio social y dirección legal:</strong> 30 N
                    Gould St, STE R, Sheridan, WY 82801, EE. UU.
                </li>
                <li>
                    <strong>Canal de notificaciones / privacidad:</strong>{" "}
                    <a href="mailto:soporte@aliabienestar.com">
                        soporte@aliabienestar.com
                    </a>{" "}
                    /{" "}
                    <a href="mailto:contacto@aliabienestar.com">
                        contacto@aliabienestar.com
                    </a>
                </li>
            </ul>

            <h2>
                1. Información general, alcance jurídico y aceptación mediante
                acción afirmativa
            </h2>

            <h3>1.1. Identificación del responsable del tratamiento</h3>
            <p>
                La presente Política de Privacidad (en adelante, la
                "Política") regula la recopilación, almacenamiento, uso,
                protección y eventual supresión de datos personales
                procesados por Alia Coaching Services LLC (en adelante, la
                "Empresa" o "Alia Coaching"), en su condición de Responsable
                del Tratamiento de Datos, a través de la página web
                aliabienestar.com, sus subdominios y los canales oficiales de
                comunicación por correo electrónico.
            </p>

            <h3>1.2. Marco normativo y cumplimiento transfronterizo</h3>
            <p>
                Alia Coaching Services LLC diseña esta Política en estricta
                conformidad con:
            </p>
            <ul>
                <li>
                    <strong>a)</strong> Reglamento General de Protección de
                    Datos de la Unión Europea (RGPD): Reglamento UE 2016/679,
                    Arts. 13 y 14.
                </li>
                <li>
                    <strong>b)</strong> Ley de Privacidad del Consumidor de
                    California (CCPA / CPRA): Cal. Civ. Code § 1798.100 et
                    seq.
                </li>
                <li>
                    <strong>c)</strong> Ley de Protección de la Privacidad
                    Infantil en Línea de EE. UU. (COPPA): 15 U.S.C. § 6501 et
                    seq.
                </li>
                <li>
                    <strong>d)</strong> Marco legal del Estado de Wyoming: Ley
                    de Comercio Electrónico y legislación aplicable del Estado
                    de Wyoming, EE. UU.
                </li>
            </ul>

            <h3>
                1.3. Aceptación mediante acción afirmativa explícita (no
                consentimiento por navegación)
            </h3>
            <p>
                De conformidad con los Artículos 4.11 y 7 del RGPD (UE
                2016/679) y las Directrices 05/2020 del Comité Europeo de
                Protección de Datos (EDPB), la mera navegación pasiva por el
                sitio web aliabienestar.com no constituye un consentimiento
                explícito ni válido para el tratamiento de datos personales.
            </p>
            <p>
                La aceptación de la presente Política y la autorización para
                el tratamiento de datos personales se deriva única y
                exclusivamente de una acción afirmativa clara, previa, libre e
                inequívoca del Usuario, perfeccionada al marcar la casilla de
                verificación ("checkbox") no preseleccionada dispuesta en los
                formularios de agendamiento, registro o contacto en la
                Plataforma, o mediante la interacción explícita con el panel
                de configuración del banner de cookies.
            </p>

            <h2>
                2. Categorías de datos personales recopilados, métodos de
                captura y deslinde clínico
            </h2>
            <p>
                Alia Coaching Services LLC recopila únicamente los datos
                personales estrictamente necesarios, pertinentes y limitados a
                lo indispensable para la gestión administrativa, el
                agendamiento de consultas, la prestación de los Servicios de
                Bienestar y la facturación correspondiente (Principio de
                Minimización de Datos - Art. 5.1.c del RGPD).
            </p>

            <h3>2.1. Categorías de datos objeto de tratamiento</h3>
            <ul>
                <li>
                    <strong>a) Datos de identificación y contacto:</strong>{" "}
                    Nombre, apellido, dirección de correo electrónico, país de
                    residencia y zona horaria. Fundamento legal: Art. 6.1.b
                    del RGPD (ejecución precontractual/contractual) y Cal.
                    Civ. Code § 1798.140(v)(1)(A) (CCPA/CPRA).
                </li>
                <li>
                    <strong>b) Datos de menores de edad (13 a 17 años):</strong>{" "}
                    Para la atención a adolescentes, se recopila únicamente la
                    información de identificación del padre, madre o tutor
                    legal, junto con la autorización explícita mediante el
                    Consentimiento Informado Parental Obligatorio. Fundamento
                    legal: Art. 8 del RGPD y Ley COPPA (15 U.S.C. § 6501 et
                    seq.).
                </li>
                <li>
                    <strong>c) Datos financieros y de transacción:</strong>{" "}
                    Las transacciones se ejecutan mediante procesamiento
                    cifrado a través de Stripe, Inc. bajo estándares PCI-DSS
                    Nivel 1. Alia Coaching Services LLC NO almacena, procesa
                    ni tiene acceso directo a números completos de
                    tarjetas de crédito/débito ni credenciales bancarias.
                    Fundamento legal: Art. 5.1.f del RGPD (integridad y
                    confidencialidad).
                </li>
                <li>
                    <strong>
                        d) Datos técnicos y de navegación (cookies y
                        tecnologías de rastreo):
                    </strong>{" "}
                    Cookies técnicas y de seguridad (IP anonimizada,
                    navegador, variables de sesión bajo Interés Legítimo -
                    Art. 6.1.f RGPD) y cookies analíticas/publicitarias de
                    terceros (Google Analytics y Píxel de Meta, bajo
                    Consentimiento Explícito Previo Opt-In - Art. 6.1.a RGPD y
                    Directiva 2002/58/CE / ePrivacy).
                </li>
            </ul>

            <h3>2.2. Métodos y canales técnicos de captura de datos</h3>
            <ul>
                <li>
                    <strong>a) Formularios web directos:</strong> Captura de
                    datos de identificación, contacto y encuadre mediante las
                    interfaces de registro y agendamiento dispuestas en el
                    sitio web aliabienestar.com.
                </li>
                <li>
                    <strong>b) Pasarela cifrada de pago:</strong> Captura y
                    procesamiento transaccional de datos financieros
                    ejecutados directamente en los servidores seguros de
                    Stripe, Inc.
                </li>
                <li>
                    <strong>c) Tecnologías de rastreo digital:</strong> Captura
                    de datos técnicos mediante la interacción del Usuario con
                    el banner interactivo de configuración de cookies al
                    ingresar a la Plataforma.
                </li>
                <li>
                    <strong>
                        d) Canales digitales oficiales y videollamadas:
                    </strong>{" "}
                    Interacción directa a través de correos electrónicos
                    oficiales, salas virtuales de videoconferencia y
                    mensajería autorizada.
                </li>
            </ul>

            <h3>
                2.3. Tratamiento de antecedentes de encuadre, datos sensibles
                de salud (SPI) y deslinde clínico
            </h3>
            <p>
                De conformidad con el Artículo 9.2.a del RGPD (UE 2016/679) y
                la clasificación de Información Personal Sensible (SPI) bajo
                la Ley CPRA de California (Cal. Civ. Code § 1798.140(eee) y §
                1798.121):
            </p>
            <ul>
                <li>
                    <strong>
                        a) Recopilación limitada de antecedentes de encuadre:
                    </strong>{" "}
                    Durante el agendamiento o registro previo, la Plataforma
                    podrá solicitar datos específicos sobre antecedentes de
                    atención psicológica previa o uso actual de
                    psicofármacos/medicamentos. Dichos datos se recopilan con
                    la única finalidad de evaluar la idoneidad del
                    acompañamiento emocional, garantizar la seguridad del
                    Usuario y determinar si el caso requiere derivación a un
                    profesional clínico especialista.
                </li>
                <li>
                    <strong>
                        b) Consentimiento explícito de datos sensibles (SPI):
                    </strong>{" "}
                    La recopilación de estos antecedentes de salud se efectúa
                    únicamente bajo el Consentimiento Expreso y Explícito del
                    Usuario otorgado al marcar la casilla específica
                    correspondiente en el formulario previo a la consulta
                    (Art. 9.2.a del RGPD y Cal. Civ. Code § 1798.121).
                </li>
                <li>
                    <strong>
                        c) Deber de confidencialidad y secreto profesional:
                    </strong>{" "}
                    Toda información sobre tratamientos o medicamentos
                    compartida por el Usuario está amparada por el más
                    estricto secreto profesional y deber de confidencialidad,
                    almacenándose de forma cifrada con acceso restringido
                    exclusivamente al Facilitador asignado.
                </li>
                <li>
                    <strong>
                        d) Deslinde clínico y ausencia de expediente médico:
                    </strong>{" "}
                    La recolección de estos datos orientativos NO constituye
                    la apertura de una historia clínica, expediente médico
                    normado ni la prestación de un servicio de psicología
                    clínica diagnóstica o psiquiatría tradicional.
                </li>
            </ul>

            <h2>
                3. Finalidades del tratamiento de los datos personales y bases
                jurídicas
            </h2>
            <p>
                Alia Coaching Services LLC utiliza la información personal
                recopilada de los Usuarios única y exclusivamente para las
                siguientes finalidades legítimas, específicas y explícitas
                (Principio de Limitación de la Finalidad - Art. 5.1.b del
                RGPD y Cal. Civ. Code § 1798.100(a)):
            </p>

            <h3>3.1. Gestión operativa del servicio y agendamiento</h3>
            <p>
                Coordinar reservas de citas, gestionar la agenda de los
                Facilitadores, enviar enlaces de acceso a las salas de
                videoconferencia y permitir la prestación efectiva de los
                Servicios de Bienestar. Base jurídica: ejecución de una
                relación precontractual o contractual (Art. 6.1.b del RGPD).
            </p>

            <h3>3.2. Evaluación de encuadre, seguridad del Usuario y derivación</h3>
            <p>
                Evaluar preliminarmente si la consulta solicitada se adapta a
                la modalidad de acompañamiento emocional y coaching de la
                Plataforma, o si requiere la recomendación de derivación a un
                profesional clínico/médico especializado. Base jurídica:
                Consentimiento Expreso y Explícito del Usuario (Art. 9.2.a del
                RGPD y Cal. Civ. Code § 1798.121).
            </p>

            <h3>3.3. Gestión financiera, facturación y modelo de cobro</h3>
            <p>
                Administrar el modelo transaccional "Consulta Primero, Pago
                Después", procesar la recepción de pagos mediante Stripe,
                Inc., gestionar comprobantes de pago y realizar el seguimiento
                de cobros o regularización de saldos pendientes. Base
                jurídica: ejecución contractual (Art. 6.1.b del RGPD) y
                cumplimiento de obligaciones legales y fiscales bajo las
                leyes del Estado de Wyoming (Art. 6.1.c del RGPD).
            </p>

            <h3>
                3.4. Atención al cliente, soporte técnico y notificaciones
                contractuales
            </h3>
            <p>
                Responder consultas, reclamos o peticiones técnicas dirigidas
                a nuestros canales oficiales, así como remitir avisos sobre
                modificaciones sustanciales en los Términos o en la presente
                Política. Base jurídica: cumplimiento de obligaciones
                contractuales (Art. 6.1.b del RGPD) e interés legítimo del
                Responsable (Art. 6.1.f del RGPD).
            </p>

            <h3>3.5. Analítica web, optimización digital y medición publicitaria</h3>
            <p>
                Analizar el tráfico de la Plataforma, medir el rendimiento del
                sitio web e interpretar la efectividad de las campañas
                publicitarias en Google Ads y Meta Ads mediante datos
                seudonimizados y métricas agregadas. Base jurídica:
                consentimiento explícito y previo del Usuario (Art. 6.1.a del
                RGPD y Directiva ePrivacy 2002/58/CE), otorgado a través del
                panel de configuración de cookies (opt-in).
            </p>

            <h3>
                3.6. Seguridad de la plataforma, prevención de fraudes y
                ejercicio de derechos legales
            </h3>
            <p>
                Garantizar la integridad de los servidores, mitigar
                ciberataques, verificar el cumplimiento de la edad mínima
                (COPPA) y respaldar la evidencia técnica en caso de disputas
                legales, acoso o violaciones graves a los Términos y
                Condiciones. Base jurídica: interés legítimo del Responsable
                (Art. 6.1.f del RGPD) y cumplimiento de obligaciones legales
                aplicables a servicios digitales (Art. 6.1.c del RGPD).
            </p>

            <h3>3.7. Ausencia de decisiones automatizadas y perfilado</h3>
            <p>
                Alia Coaching Services LLC NO lleva a cabo evaluaciones,
                análisis de perfiles ("profiling") ni adopta decisiones
                basadas exclusivamente en el tratamiento automatizado de
                datos personales que produzcan efectos jurídicos en el
                Usuario o le afecten significativamente de modo similar (Art.
                22 del RGPD). Todas las evaluaciones relativas a la adecuación
                del servicio o encuadre inicial cuentan con intervención y
                criterio humano directo.
            </p>

            <h2>
                4. Plazos de conservación de datos, confidencialidad y
                retención legal
            </h2>
            <p>
                Alia Coaching Services LLC conserva los datos personales
                únicamente durante el tiempo estrictamente necesario para
                cumplir con las finalidades para las cuales fueron
                recopilados, respetando el Principio de Limitación del Plazo
                de Conservación (Art. 5.1.e del RGPD).
            </p>

            <h3>4.1. Criterios y periodos específicos de conservación</h3>
            <ul>
                <li>
                    <strong>
                        a) Datos de identificación, contacto y agendamiento:
                    </strong>{" "}
                    Se conservarán mientras se mantenga activa la relación de
                    servicio con el Usuario y, tras su finalización, durante
                    el plazo de prescripción legal aplicable a las acciones
                    contractuales en la jurisdicción correspondiente (hasta 5
                    años bajo el marco europeo general o hasta 10 años
                    conforme al Estatuto de Limitaciones contractuales del
                    Estado de Wyoming, Wyo. Stat. § 1-3-105).
                </li>
                <li>
                    <strong>
                        b) Antecedentes de encuadre y datos sensibles (SPI):
                    </strong>{" "}
                    Toda información referida a atención previa o medicamentos
                    será conservada exclusivamente durante la vigencia del
                    proceso de acompañamiento emocional. Una vez finalizadas o
                    canceladas las sesiones, dichos datos serán eliminados de
                    forma segura o anonimizados irreversiblemente en un plazo
                    máximo de sesenta (60) días, salvo autorización expresa
                    del Usuario para su conservación continua.
                </li>
                <li>
                    <strong>c) Registros financieros y de facturación:</strong>{" "}
                    Las evidencias de transacciones, comprobantes y registros
                    fiscales procesados a través de Stripe, Inc. se
                    conservarán por un periodo obligatorio de siete (7) años,
                    en estricto cumplimiento de las obligaciones contables y
                    tributarias del Servicio de Impuestos Internos de EE. UU.
                    (IRS) y las leyes corporativas del Estado de Wyoming.
                </li>
                <li>
                    <strong>d) Datos técnicos y de navegación (cookies):</strong>{" "}
                    Las cookies técnicas expiran al finalizar la sesión del
                    navegador. Las métricas analíticas recopiladas vía Google
                    Analytics o Píxel de Meta se conservarán por un periodo
                    máximo de catorce (14) meses desde su captura, conforme a
                    la política de retención del proveedor.
                </li>
                <li>
                    <strong>
                        e) Autorizaciones y consentimientos informados
                        parentales (13 a 17 años):
                    </strong>{" "}
                    Los registros y evidencias de consentimiento otorgado por
                    padres o tutores legales se conservarán durante la
                    vigencia de la atención al menor y por un periodo
                    posterior de cinco (5) años a partir del cierre del caso o
                    hasta que el Usuario alcance la mayoría de edad legal,
                    como evidencia auditable de cumplimiento ante autoridades
                    de protección infantil (COPPA - 15 U.S.C. § 6501 y Art. 8
                    del RGPD).
                </li>
            </ul>

            <h3>4.2. Deber de confidencialidad y secreto profesional</h3>
            <p>
                Todos los datos procesados por Alia Coaching Services LLC,
                especialmente la información compartida en el contexto de las
                sesiones de bienestar y formularios previos, están amparados
                por un deber de estricta confidencialidad y secreto
                profesional. Ningún Facilitador o miembro del equipo
                administrativo divulgará, compartirá ni comercializará dichos
                datos con terceros ajenos a la estructura corporativa.
            </p>

            <h3>
                4.3. Excepción legal de retención y denegación del derecho de
                supresión (derecho al olvido)
            </h3>
            <p>
                De conformidad con las excepciones legales expresas
                contempladas en el Artículo 17.3.e del RGPD (UE 2016/679) y
                Cal. Civ. Code § 1798.105(d) (CCPA/CPRA), Alia Coaching
                Services LLC se reserva el derecho de denegar la solicitud de
                eliminación o borrado de datos personales y mantener la
                información debidamente bloqueada cuando:
            </p>
            <ul>
                <li>
                    <strong>
                        a) Existencia de saldos pendientes o incumplimiento
                        obligacional:
                    </strong>{" "}
                    El Usuario mantenga deudas activas, saldos pendientes de
                    pago derivados del modelo "Consulta Primero, Pago
                    Después" o disputas transaccionales no resueltas con la
                    Empresa.
                </li>
                <li>
                    <strong>
                        b) Formulación, ejercicio o defensa de reclamaciones:
                    </strong>{" "}
                    Los datos sean necesarios para el respaldo probatorio,
                    defensa jurídica o sustento de acciones legales ante
                    posibles disputas, infracciones a los Términos y
                    Condiciones, actos de acoso o incidentes de seguridad.
                </li>
                <li>
                    <strong>
                        c) Cumplimiento de obligaciones legales o
                        requerimiento judicial:
                    </strong>{" "}
                    Exista una obligación legal de retención fiscal/contable o
                    un mandato imperativo dictado por autoridad judicial o
                    administrativa competente.
                </li>
            </ul>

            <h2>
                5. Destinatarios de los datos, encargados del tratamiento y
                transferencias internacionales
            </h2>

            <h3>
                5.1. Comunicación de datos a terceros encargados del
                tratamiento (stack tecnológico)
            </h3>
            <p>
                Alia Coaching Services LLC NO vende, alquila ni comparte ("No
                Sale / No Share") datos personales u Información Personal
                Sensible (SPI) de los Usuarios con terceros para fines
                comerciales o publicidad comportamental de contexto cruzado
                (Cal. Civ. Code § 1798.120 y § 1798.135).
            </p>
            <p>
                Para la prestación efectiva de los Servicios de Bienestar, la
                gestión transaccional y la seguridad técnica de la
                Plataforma, la Empresa comparte datos estrictamente
                necesarios con los siguientes proveedores tecnológicos
                (Encargados del Tratamiento), bajo contratos de procesamiento
                de datos (DPA) adaptados al RGPD:
            </p>
            <ul>
                <li>
                    <strong>
                        a) Infraestructura de alojamiento web y despliegue:
                    </strong>{" "}
                    Vercel, Inc. (San Francisco, CA, EE. UU.).
                </li>
                <li>
                    <strong>
                        b) Gestión de base de datos y almacenamiento seguro:
                    </strong>{" "}
                    Supabase, Inc. (San Francisco, CA, EE. UU.).
                </li>
                <li>
                    <strong>
                        c) Seguridad de red, enrutamiento DNS y cifrado SSL:
                    </strong>{" "}
                    Cloudflare, Inc. (San Francisco, CA, EE. UU.).
                </li>
                <li>
                    <strong>d) Procesamiento cifrado de pagos:</strong>{" "}
                    Stripe, Inc. (San Francisco, CA, EE. UU.), bajo estándares
                    PCI-DSS Nivel 1.
                </li>
                <li>
                    <strong>
                        e) Gestión de correspondencia y correo electrónico:
                    </strong>{" "}
                    Cloudflare, Inc. y Google LLC / Gmail (Mountain View, CA,
                    EE. UU.).
                </li>
                <li>
                    <strong>
                        f) Analítica web y medición publicitaria (bajo
                        consentimiento previo):
                    </strong>{" "}
                    Google LLC (Google Analytics) y Meta Platforms, Inc. (Meta
                    Pixel).
                </li>
                <li>
                    <strong>g) Infraestructura de videoconferencias:</strong>{" "}
                    Proveedores de salas virtuales cifradas (p. ej., Zoom
                    Video Communications, Inc. o Google Meet).
                </li>
                <li>
                    <strong>
                        h) Asesores legales, contables y autoridades públicas:
                    </strong>{" "}
                    Exclusivamente cuando exista una obligación legal, fiscal
                    o procesal impuesta por autoridades competentes de EE. UU.
                    o tribunales internacionales.
                </li>
            </ul>

            <h3>
                5.2. Transferencias internacionales de datos y mecanismos de
                salvaguarda
            </h3>
            <p>
                Atendido que Alia Coaching Services LLC es una entidad
                constituida bajo las leyes del Estado de Wyoming, EE. UU., y
                que la infraestructura de sus Encargados del Tratamiento
                radica en territorio estadounidense, el uso de la Plataforma
                implica la transferencia internacional de datos personales
                desde la Unión Europea / Espacio Económico Europeo (EEE) hacia
                los Estados Unidos de América. Dichas transferencias se
                ejecutan en estricta conformidad con el Capítulo V del RGPD
                (Arts. 44 a 49), amparadas en:
            </p>
            <ul>
                <li>
                    <strong>
                        a) Marco de Privacidad de Datos Unión Europea - EE.
                        UU. (EU-U.S. Data Privacy Framework):
                    </strong>{" "}
                    Transferencias hacia proveedores certificados activamente
                    en el DPF (Google LLC, Meta Platforms, Inc., Stripe, Inc.
                    y Cloudflare, Inc.), conforme a la Decisión de Adecuación
                    de la Comisión Europea de 10 de julio de 2023.
                </li>
                <li>
                    <strong>
                        b) Cláusulas Contractuales Tipo (Standard Contractual
                        Clauses - SCCs):
                    </strong>{" "}
                    Para proveedores de infraestructura como Vercel, Inc. y
                    Supabase, Inc., las transferencias se rigen por las
                    Cláusulas Contractuales Tipo aprobadas por la Decisión de
                    Ejecución (UE) 2021/914 de la Comisión Europea.
                </li>
                <li>
                    <strong>c) Garantías adicionales de cifrado:</strong> Todo
                    dato transferido y procesado internacionalmente cuenta con
                    cifrado en tránsito mediante protocolos seguros SSL/TLS
                    (HTTPS) y cifrado en reposo utilizando el estándar
                    simétrico avanzado AES-256.
                </li>
            </ul>

            <h3>
                5.3. Deslinde de responsabilidad sobre enlaces y sitios web de
                terceros
            </h3>
            <p>
                La Plataforma puede contener enlaces hacia sitios web,
                aplicaciones o servicios de terceros. La presente Política
                aplica única y exclusivamente a los datos personales
                recopilados por Alia Coaching Services LLC. La Empresa no
                ejerce control ni asume responsabilidad sobre las prácticas
                de privacidad, políticas o contenidos de dichos sitios
                externos.
            </p>

            <h2>
                6. Derechos de los usuarios (RGPD, CCPA/CPRA y derechos ARCO)
                y mecanismos de ejercicio
            </h2>

            <h3>6.1. Catálogo de derechos reconocidos</h3>
            <ul>
                <li>
                    <strong>a) Derecho de acceso</strong> (Art. 15 del RGPD /
                    Cal. Civ. Code § 1798.100): solicitar y obtener
                    confirmación de si la Empresa está tratando tus datos
                    personales, así como recibir una copia de las categorías
                    de datos procesados, las finalidades y los destinatarios.
                </li>
                <li>
                    <strong>b) Derecho de rectificación</strong> (Art. 16 del
                    RGPD / Cal. Civ. Code § 1798.106): exigir la corrección o
                    actualización de tus datos personales cuando sean
                    inexactos, incompletos o desactualizados.
                </li>
                <li>
                    <strong>
                        c) Derecho de supresión o "derecho al olvido"
                    </strong>{" "}
                    (Art. 17 del RGPD / Cal. Civ. Code § 1798.105): solicitar
                    la eliminación de tus datos personales, sujeta a las
                    excepciones legales de denegación descritas en la Sección
                    4.3 de esta Política.
                </li>
                <li>
                    <strong>d) Derecho a la limitación del tratamiento</strong>{" "}
                    (Art. 18 del RGPD): solicitar el bloqueo temporal del
                    tratamiento de tus datos cuando impugnes su inexactitud o
                    mientras se resuelve una oposición.
                </li>
                <li>
                    <strong>e) Derecho a la portabilidad de los datos</strong>{" "}
                    (Art. 20 del RGPD): recibir los datos personales que hayas
                    facilitado en un formato estructurado, de uso común y
                    lectura mecánica (p. ej., JSON o CSV).
                </li>
                <li>
                    <strong>
                        f) Derecho de oposición y retirada del consentimiento
                    </strong>{" "}
                    (Art. 21 y 7.3 del RGPD): oponerte en cualquier momento al
                    tratamiento de tus datos o retirar el consentimiento
                    previamente otorgado (incluyendo el revocamiento del
                    permiso de cookies analíticas o de tratamiento de
                    antecedentes de encuadre).
                </li>
                <li>
                    <strong>
                        g) Derechos específicos de California (CPRA):
                    </strong>{" "}
                    derecho a la no discriminación (Cal. Civ. Code §
                    1798.125), derecho a limitar el uso de Información
                    Personal Sensible (Cal. Civ. Code § 1798.121) y
                    reconocimiento automático de señales opt-out de
                    preferencia (Global Privacy Control - GPC / Cal. Code
                    Regs. tit. 11, § 7025).
                </li>
            </ul>

            <h3>6.2. Procedimiento y canales de ejercicio</h3>
            <p>
                Para hacer valer cualquiera de los derechos descritos, envía
                una solicitud formal por escrito a{" "}
                <a href="mailto:soporte@aliabienestar.com">
                    soporte@aliabienestar.com
                </a>{" "}
                o{" "}
                <a href="mailto:contacto@aliabienestar.com">
                    contacto@aliabienestar.com
                </a>
                , con el asunto "Ejercicio de Derechos de Privacidad -
                [Nombre y Apellido del Usuario]".
            </p>

            <h3>
                6.3. Verificación de identidad, agentes autorizados,
                gratuidad y plazos de respuesta
            </h3>
            <ul>
                <li>
                    <strong>a) Autenticación del solicitante:</strong> la
                    Empresa verificará tu identidad requiriendo confirmación
                    desde el correo electrónico registrado en la Plataforma o
                    copia de un documento de identificación oficial.
                </li>
                <li>
                    <strong>
                        b) Representación mediante agentes autorizados
                        (California):
                    </strong>{" "}
                    los Usuarios residentes en California pueden designar un
                    agente autorizado, que deberá presentar una autorización
                    firmada, poder legal válido o prueba de representación
                    (Cal. Civ. Code § 1798.130(a)(1)(C)).
                </li>
                <li>
                    <strong>c) Gratuidad y excepción por peticiones infundadas o excesivas:</strong>{" "}
                    el ejercicio de los derechos de privacidad es gratuito.
                    Cuando las solicitudes sean manifiestamente infundadas,
                    repetitivas o excesivas, Alia Coaching Services LLC podrá
                    cobrar un canon razonable o negarse a actuar (Art. 12.5
                    del RGPD y CCPA).
                </li>
                <li>
                    <strong>d) Plazo de respuesta RGPD:</strong> un (1) mes
                    (30 días) a partir de la recepción, prorrogable por dos
                    (2) meses más en casos de complejidad excepcional.
                </li>
                <li>
                    <strong>e) Plazo de respuesta CCPA/CPRA:</strong> cuarenta
                    y cinco (45) días, prorrogables por cuarenta y cinco (45)
                    días adicionales cuando sea razonablemente necesario.
                </li>
            </ul>

            <h3>6.4. Derecho a presentar reclamación ante autoridades de control</h3>
            <p>
                Si consideras que el tratamiento de tus datos personales
                infringe las normativas de privacidad vigentes, tienes
                derecho a presentar una reclamación ante la Autoridad de
                Protección de Datos competente de tu Estado Miembro de la
                Unión Europea (p. ej., la AEPD en España), o ante la Agencia
                de Protección de la Privacidad de California (CPPA) o la
                Oficina del Fiscal General de California (OAG).
            </p>

            <h2>
                7. Medidas de seguridad, notificación de brechas de
                seguridad, menores de edad y actualizaciones
            </h2>

            <h3>7.1. Medidas de seguridad técnicas, organizativas y ciberseguridad</h3>
            <p>
                Alia Coaching Services LLC implementa medidas de seguridad
                técnicas y organizativas apropiadas para proteger los datos
                personales contra la destrucción, pérdida, alteración,
                comunicación no autorizada o acceso ilícito (Art. 32 del
                RGPD), incluyendo cifrado SSL/TLS (HTTPS) en tránsito, cifrado
                simétrico AES-256 en reposo, controles de acceso restringido
                mediante autenticación de doble factor (2FA) y roles
                segmentados, e infraestructura protegida mediante cortafuegos
                de aplicación web (WAF) y mitigación de ataques DDoS
                gestionados por Cloudflare, Inc.
            </p>

            <h3>
                7.2. Protocolo de notificación de incidentes y brechas de
                seguridad (data breach)
            </h3>
            <p>
                En caso de un incidente de seguridad que afecte a los datos
                personales custodiados por la Empresa y suponga un riesgo
                para los derechos y libertades de los Usuarios, se notificará
                a la Autoridad de Protección de Datos competente en un plazo
                máximo de setenta y dos (72) horas (Art. 33 del RGPD, Wyoming
                Stat. § 40-12-502 y Cal. Civ. Code § 1798.82), y se comunicará
                a los Usuarios afectados sin dilación indebida cuando exista
                un alto riesgo.
            </p>

            <h3>7.3. Protección de menores de edad (COPPA y RGPD)</h3>
            <p>
                La Plataforma no está dirigida ni recopila a sabiendas datos
                personales de menores de 13 años. Para el acompañamiento a
                adolescentes de entre 13 y 17 años, la prestación de los
                Servicios de Bienestar está estrictamente condicionada a la
                obtención previa del Consentimiento Informado Parental
                Obligatorio (Ley COPPA - 15 U.S.C. § 6501 y Art. 8 del RGPD).
                Si se detecta la recolección no autorizada de datos de un
                menor de 13 años, dichos registros serán eliminados de
                inmediato.
            </p>
            <p>
                Los padres o tutores legales conservan el derecho explícito y
                continuo a revisar, corregir, actualizar o exigir la
                supresión inmediata de la información personal de sus hijos
                menores, así como a revocar el consentimiento otorgado
                previamente, mediante solicitud a{" "}
                <a href="mailto:soporte@aliabienestar.com">
                    soporte@aliabienestar.com
                </a>
                .
            </p>

            <h3>7.4. Modificaciones y actualizaciones de la Política de Privacidad</h3>
            <p>
                Alia Coaching Services LLC se reserva el derecho de modificar
                o actualizar la presente Política para reflejar cambios
                legislativos, jurisprudenciales, técnicos o en la estructura
                operativa de los Servicios de Bienestar. Cualquier
                modificación sustancial será notificada con al menos quince
                (15) días de antelación a su entrada en vigor, mediante aviso
                destacado en el sitio web o correo electrónico. El uso
                continuado de la Plataforma tras la entrada en vigor de los
                cambios constituirá la aceptación explícita de los mismos.
            </p>

            <h3>
                7.5. Datos de contacto del responsable del tratamiento y
                punto de contacto UE (Art. 27 del RGPD)
            </h3>
            <ul>
                <li>
                    <strong>Razón social:</strong> Alia Coaching Services LLC
                </li>
                <li>
                    <strong>Estado de incorporación:</strong> Wyoming, Estados
                    Unidos
                </li>
                <li>
                    <strong>Sitio web oficial:</strong>{" "}
                    <a
                        href="https://aliabienestar.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        aliabienestar.com
                    </a>
                </li>
                <li>
                    <strong>Correo electrónico de privacidad y soporte:</strong>{" "}
                    <a href="mailto:soporte@aliabienestar.com">
                        soporte@aliabienestar.com
                    </a>{" "}
                    /{" "}
                    <a href="mailto:contacto@aliabienestar.com">
                        contacto@aliabienestar.com
                    </a>
                </li>
                <li>
                    <strong>Punto de contacto directo para la Unión Europea:</strong>{" "}
                    los canales de correo electrónico indicados actúan como la
                    vía de comunicación directa habilitada para la recepción
                    y gestión de solicitudes emanadas de residentes y
                    autoridades de la Unión Europea.
                </li>
            </ul>
        </LegalPageLayout>
    );
}
