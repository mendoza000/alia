import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms";

export const metadata: Metadata = {
    title: "Términos y Condiciones | ALIA",
};

export default function TerminosPage() {
    return (
        <LegalPageLayout title="Términos y Condiciones">
            <p className="text-xs text-muted-foreground">
                Versión {CURRENT_TERMS_VERSION} — Consolidada Definitiva
                (2026)
            </p>
            <p>
                El presente documento constituye un contrato legalmente
                vinculante entre el Usuario y Alia Coaching Services LLC. Te
                pedimos leer detenidamente cada una de las siguientes
                estipulaciones antes de hacer uso de la plataforma o
                contratar los servicios.
            </p>

            <h2>
                1. Información general, definiciones y naturaleza del
                servicio
            </h2>

            <h3>1.1. Identificación de la entidad titular</h3>
            <p>
                Los presentes Términos y Condiciones de Uso (en adelante, los
                "Términos") constituyen un acuerdo legalmente vinculante
                celebrado entre el usuario (en adelante, el "Usuario") y Alia
                Coaching Services LLC, una compañía de responsabilidad
                limitada (Limited Liability Company) constituida y organizada
                bajo las leyes del Estado de Wyoming, Estados Unidos de
                América. Toda navegación, registro, agendamiento o
                contratación realizada en aliabienestar.com o cualquiera de
                sus dominios y subdominios asociados se entenderá celebrada de
                manera directa e inequívoca con Alia Coaching Services LLC.
            </p>
            <p>
                Canales electrónicos oficiales:{" "}
                <a href="mailto:contacto@aliabienestar.com">
                    contacto@aliabienestar.com
                </a>{" "}
                (atención general y notificaciones legales) y{" "}
                <a href="mailto:soporte@aliabienestar.com">
                    soporte@aliabienestar.com
                </a>{" "}
                (asistencia técnica, agendamiento y gestión de pagos).
            </p>

            <h3>1.2. Definiciones legales y operativas</h3>
            <ul>
                <li>
                    <strong>a) "Plataforma":</strong> el sitio web
                    aliabienestar.com, sus subdominios, infraestructura
                    digital, interfaces de agendamiento y canales de
                    comunicación operados por Alia Coaching Services LLC.
                </li>
                <li>
                    <strong>b) "Usuario":</strong> persona natural que accede,
                    navega, se registra o contrata los Servicios de Bienestar
                    ofertados en la Plataforma.
                </li>
                <li>
                    <strong>c) "Facilitador / Consultor":</strong> profesional
                    independiente o colaborador calificado que ofrece
                    servicios de mentoría, orientación y desarrollo personal a
                    través de la Plataforma.
                </li>
                <li>
                    <strong>d) "Servicios de Bienestar":</strong> sesiones
                    virtuales de acompañamiento emocional, desarrollo personal
                    y coaching situacional orientadas al crecimiento personal
                    y la gestión emocional.
                </li>
                <li>
                    <strong>e) "Requisito de Mayoría de Edad":</strong> en
                    cumplimiento de la Ley COPPA (15 U.S.C. § 6501) y el Art.
                    8 del RGPD, los servicios están destinados exclusivamente
                    a personas mayores de 18 años (salvo el régimen de
                    excepción previsto en la Cláusula 2.3).
                </li>
            </ul>

            <h3>
                1.3. Aceptación expresa, perfeccionamiento y validez del
                contrato digital
            </h3>
            <p>
                La aceptación formal de estos Términos se perfecciona mediante
                la confirmación expresa (mecanismo click-wrap) al marcar la
                casilla de verificación ("checkbox") dispuesta durante el
                proceso de agenda, registro o pago en la Plataforma. De
                conformidad con la Ley de Firmas Electrónicas de EE. UU.
                (E-SIGN Act - 15 U.S.C. § 7001 et seq.) y la Directiva sobre
                Comercio Electrónico de la Unión Europea (Directiva
                2000/31/CE), dicha manifestación electrónica posee plena
                validez y fuerza vinculante, equivalente a una firma
                manuscrita. Si el Usuario no está de acuerdo con la totalidad
                de estas cláusulas, deberá abstenerse inmediatamente de
                utilizar la Plataforma.
            </p>

            <h3>
                1.4. Naturaleza del servicio y deslinde clínico / médico (FTC
                Act - Sec. 5)
            </h3>
            <p>
                ALIA es un servicio de acompañamiento y bienestar emocional.
                No constituye terapia psicológica clínica, diagnóstico médico
                ni tratamiento psiquiátrico. En estricto cumplimiento de la
                Ley de la Comisión Federal de Comercio (FTC Act, Sec. 5), Alia
                Coaching Services LLC declara que sus servicios están
                dirigidos exclusivamente al bienestar emocional, desarrollo
                personal y coaching situacional.
            </p>
            <ul>
                <li>
                    <strong>Exclusión médica y psiquiátrica:</strong> Alia
                    Coaching Services LLC NO es una institución médica,
                    proveedor de salud pública, ni prestador de servicios de
                    telemedicina, psicología clínica diagnóstica o psiquiatría
                    tradicional.
                </li>
                <li>
                    <strong>Ausencia de actos clínicos:</strong> ningún
                    Facilitador dentro de la Plataforma emitirá diagnósticos
                    clínicos, tratamientos para trastornos patológicos, ni
                    prescripciones de psicofármacos o medicamentos.
                </li>
                <li>
                    <strong>No sustitución de atención especializada:</strong>{" "}
                    los Servicios de Bienestar prestados no sustituyen ni
                    reemplazan la consulta, evaluación o tratamiento médico,
                    psicoterapéutico o psiquiátrico presencial o
                    especializado.
                </li>
            </ul>
            <p>
                Alia Coaching Services LLC y sus Facilitadores no emiten
                certificados de salud mental, incapacidades laborales,
                justificantes oficiales para ausentismo, peritajes judiciales,
                ni ningún tipo de dictamen con validez legal ante tribunales
                de justicia u organismos públicos.
            </p>

            <h3>1.5. Atención en situaciones de crisis</h3>
            <p>
                ALIA no atiende emergencias médicas ni psiquiátricas. Si tú o
                alguien cercano está en riesgo o atravesando una crisis,
                contacta de inmediato a los servicios de emergencia de tu país
                o a una línea de ayuda local. Puedes encontrar la línea de
                ayuda disponible en tu país en{" "}
                <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    findahelpline.com
                </a>
                .
            </p>

            <h3>
                1.6. Servicios de terceros, infraestructura tecnológica e
                integración
            </h3>
            <p>
                Para la gestión operativa, atención de consultas y
                procesamiento transaccional, la Plataforma integra
                herramientas de proveedores independientes. El Usuario
                reconoce que el uso de dichas plataformas está sujeto a los
                términos de uso y políticas de privacidad de cada proveedor,
                sobre los cuales Alia Coaching Services LLC no ejerce control
                operativo ni asume responsabilidad jurídica:
            </p>
            <ul>
                <li>
                    <strong>a) Meta Platforms, Inc. (WhatsApp Business):</strong>{" "}
                    al registrarte o agendar, autorizas expresamente el envío
                    de notificaciones operativas, confirmaciones de citas,
                    recordatorios y enlaces de pago a través de WhatsApp o
                    SMS. Alia Coaching Services LLC no responde por
                    interrupciones globales del servicio de WhatsApp, fallas
                    de encriptación derivadas del dispositivo del Usuario ni
                    brechas de seguridad que ocurran en los servidores de Meta
                    Platforms, Inc.
                </li>
                <li>
                    <strong>
                        b) Proveedores de correo electrónico y
                        telecomunicaciones:
                    </strong>{" "}
                    la Plataforma queda exonerada de retrasos en la entrega,
                    bloqueos por filtros de spam o fallas de recepción
                    ocasionadas por los proveedores de correo del Usuario o
                    por caídas generales de internet.
                </li>
                <li>
                    <strong>
                        c) Pasarelas de pago de terceros (Stripe, Inc. y
                        afiliados):
                    </strong>{" "}
                    las transacciones financieras se ejecutan a través de
                    Stripe, Inc. bajo estándares PCI-DSS. Alia Coaching
                    Services LLC no almacena ni procesa directamente números
                    completos de tarjetas ni credenciales bancarias, y no será
                    responsable por rechazos de pagos, comisiones por
                    conversión de moneda ajenas a la Plataforma o fallas
                    operativas de la pasarela.
                </li>
                <li>
                    <strong>
                        d) Vercel, Inc. (alojamiento e infraestructura web):
                    </strong>{" "}
                    Alia Coaching Services LLC queda exonerada de
                    responsabilidad por interrupciones temporales del sitio,
                    caídas de servidor o mantenimientos no programados
                    derivados de la red global de Vercel.
                </li>
                <li>
                    <strong>
                        e) Supabase, Inc. (base de datos e infraestructura de
                        backend):
                    </strong>{" "}
                    la Empresa no responderá por caídas del sistema de base de
                    datos, latencia de red o fallas ajenas a nuestra gestión
                    directa que ocurran en los servidores de dicho proveedor.
                </li>
                <li>
                    <strong>
                        f) Cloudflare, Inc. (dominio, DNS y correo
                        corporativo):
                    </strong>{" "}
                    Alia Coaching Services LLC no asume responsabilidad por
                    retrasos en la entrega de correos, fallas de enrutamiento,
                    ataques DDoS mitigados externamente o caídas en la
                    resolución de nombres de dominio ocasionadas en la red
                    global de Cloudflare.
                </li>
            </ul>

            <h3>
                1.7. Exención general por datos erróneos del Usuario y
                enlaces externos
            </h3>
            <p>
                Alia Coaching Services LLC queda eximida de cualquier
                responsabilidad legal si el Usuario proporciona información
                falsa, errónea o incompleta durante la reserva o
                contratación. La presencia de enlaces hacia sitios o recursos
                de terceros en la Plataforma no implica respaldo ni garantía
                sobre sus contenidos, servicios o políticas.
            </p>

            <h2>
                2. Capacidad legal, edad mínima y régimen de atención a
                adolescentes
            </h2>

            <h3>2.1. Capacidad legal general para contratar</h3>
            <p>
                El acceso a la Plataforma y la contratación de los Servicios
                de Bienestar están reservados a personas naturales que
                ostenten plena capacidad legal para contraer obligaciones
                contractuales válidas, conforme a la legislación aplicable en
                su país de residencia o domicilio. Al hacer clic en el botón
                de agendamiento, registro o pago, el Usuario declara bajo
                juramento que toda la información proporcionada respecto a su
                identidad, edad y capacidad jurídica es veraz, exacta y
                actualizada.
            </p>

            <h3>2.2. Regla general: mayores de edad</h3>
            <p>
                Los Servicios de Bienestar ofertados por Alia Coaching
                Services LLC están diseñados y dirigidos de manera estándar a
                personas mayores de dieciocho (18) años.
            </p>

            <h3>
                2.3. Régimen especial y protocolo para adolescentes (13 a 17
                años)
            </h3>
            <p>
                De conformidad con el Reglamento General de Protección de
                Datos de la Unión Europea (RGPD UE 2016/679, Art. 8) y la Ley
                de Protección de la Privacidad Infantil en Línea de los EE.
                UU. (COPPA - 15 U.S.C. § 6501 et seq.), Alia Coaching Services
                LLC habilita la prestación de Servicios de Bienestar a
                adolescentes cuya edad esté comprendida única y exclusivamente
                entre los trece (13) y diecisiete (17) años de edad, bajo el
                cumplimiento estricto del siguiente protocolo imperativo:
            </p>
            <ul>
                <li>
                    <strong>
                        a) Consentimiento informado parental obligatorio:
                    </strong>{" "}
                    ningún adolescente entre 13 y 17 años podrá recibir
                    Servicios de Bienestar sin la previa autorización
                    explícita, escrita y firmada del documento de
                    "Consentimiento Informado para Menores" por parte de su
                    padre, madre o tutor/representante legal debidamente
                    acreditado.
                </li>
                <li>
                    <strong>b) Verificación de la representación legal:</strong>{" "}
                    Alia Coaching Services LLC se reserva el derecho de
                    exigir, en cualquier momento, la presentación de
                    documentos de identidad oficiales que acrediten de forma
                    indudable la filiación o representación legal sobre el
                    menor.
                </li>
                <li>
                    <strong>c) Retención del servicio por incumplimiento:</strong>{" "}
                    si un servicio es agendado para un adolescente sin que se
                    haya remitido previamente el Consentimiento Informado
                    firmado, la sesión será suspendida y no podrá ejecutarse
                    hasta subsanar formalmente dicha omisión.
                </li>
                <li>
                    <strong>d) Derecho de revocación parental:</strong> los
                    padres o tutores legales conservan el derecho indisponible
                    de revocar su autorización en cualquier momento mediante
                    comunicación escrita a los canales oficiales, lo que
                    causará la cancelación inmediata de las sesiones futuras
                    del menor.
                </li>
            </ul>

            <h3>
                2.4. Prohibición absoluta para menores de 13 años y penalidad
                por incumplimiento
            </h3>
            <p>
                Alia Coaching Services LLC NO presta servicios, NO recopila
                datos personales, ni atiende bajo ninguna modalidad a niños o
                niñas menores de trece (13) años de edad. Si la Plataforma
                detecta que un menor de 13 años ha accedido al servicio
                mediante la falsificación de su edad o información engañosa,
                Alia Coaching Services LLC procederá al bloqueo inmediato de
                la cuenta, a la cancelación definitiva del servicio y a la
                eliminación segura de sus datos de nuestros sistemas.
            </p>

            <h2>
                3. Condiciones de atención, condiciones financieras,
                cancelaciones y corresponsabilidad
            </h2>

            <h3>3.1. Modalidad de servicio ("Consulta Primero, Pago Después")</h3>
            <p>
                Alia Coaching Services LLC opera bajo un modelo de confianza
                operativa en el cual el Usuario agenda y recibe la sesión o
                consulta de bienestar previa a la realización del pago
                correspondiente, sujeto al cumplimiento de las reglas de
                compromiso contractual aquí estipuladas.
            </p>

            <h3>3.2. Nacimiento de la obligación de pago, monedas y tarifas regionales</h3>
            <p>
                La prestación efectiva de la sesión por parte del Facilitador
                genera de manera inmediata, automática e irrevocable una
                obligación de pago clara, líquida y exigible a cargo del
                Usuario. Alia Coaching Services LLC establece tarifas fijas
                adaptadas a cada región operativa: las transacciones se
                procesarán en Pesos Colombianos (COP) para Colombia y en
                Euros (EUR) para la Unión Europea. El cobro en Dólares de los
                Estados Unidos (USD) se aplicará exclusivamente a Usuarios de
                países donde la Plataforma no mantenga una tarifa fija
                regional oficial. Si el Usuario paga con una tarjeta o cuenta
                en una moneda distinta a la de cobro asignada, el tipo de
                cambio, la Tasa de Cambio Representativa del Mercado (TRM) del
                día y las comisiones de conversión son fijados y cobrados
                exclusivamente por el banco emisor y la franquicia
                correspondiente, sin que Alia Coaching Services LLC tenga
                control ni responsabilidad sobre dichos montos.
            </p>

            <h3>3.3. Plazo y condiciones para la cancelación del pago</h3>
            <p>
                El Usuario se compromete a efectuar el pago completo de la
                tarifa correspondiente a la sesión recibida dentro de un plazo
                máximo e improrrogable de veinticuatro (24) horas posteriores
                a la hora de finalización de la consulta, a través de los
                canales o pasarelas de pago oficiales provistos por Alia
                Coaching Services LLC.
            </p>

            <h3>3.4. Margen de tolerancia e inasistencia (no-show)</h3>
            <p>
                El Facilitador mantendrá el canal o sala virtual abierta
                durante un tiempo máximo de tolerancia de quince (15) minutos
                contados a partir de la hora pactada. Si el Usuario no se
                presenta o no se conecta dentro de ese margen sin haber
                notificado previa reprogramación, la cita se declarará como
                "Inasistencia por el Usuario" (No-Show), generándose
                igualmente el cobro de la tarifa o de una penalidad por
                reserva operativa, debido al tiempo efectivo bloqueado y
                reservado por el Facilitador.
            </p>

            <h3>3.5. Política de reprogramación y cancelación oportuna</h3>
            <p>
                El Usuario podrá cancelar o solicitar la reprogramación de su
                cita sin penalización alguna, siempre que lo notifique a la
                Plataforma con un mínimo de veinticuatro (24) horas de
                antelación a la hora agendada. Si la cancelación o
                reprogramación se solicita con menos de 24 horas de
                antelación, se generará una penalidad fija equivalente al
                cien por ciento (100%) de la tarifa correspondiente, en
                concepto de compensación por la agenda bloqueada al
                Facilitador. Alia Coaching Services LLC se reserva la
                facultad de eximir o bonificar dicha penalidad de manera
                discrecional por motivos de caso fortuito debidamente
                comprobados.
            </p>

            <h3>3.6. Consecuencias jurídicas y operativas por impago o morosidad</h3>
            <p>
                Si el Usuario no efectúa el pago dentro del plazo estipulado
                en el punto 3.3 tras haber recibido la consulta: (a) Alia
                Coaching Services LLC suspenderá de forma inmediata cualquier
                agendamiento futuro, seguimiento o atención pendiente; (b) la
                cuenta del Usuario quedará suspendida hasta que se subsane la
                totalidad del saldo deudor; y (c) Alia Coaching Services LLC
                se reserva el derecho de emprender gestiones de cobro
                extrajudiciales o judiciales, así como reclamar los gastos de
                cobranza o intereses de mora generados por el incumplimiento
                contractual.
            </p>

            <h3>
                3.7. Excepción de reembolsos por servicios ya prestados y
                política ante pasarelas
            </h3>
            <p>
                Dado que el Usuario recibe la sesión de bienestar de forma
                previa a la realización del pago, la ejecución posterior de
                la transacción constituye la confirmación expresa de la
                recepción y conformidad con el servicio prestado. Como regla
                general, una vez prestada la consulta y procesado el pago
                posterior, no procederá solicitud de reembolso, devolución ni
                reajuste económico. Únicamente se procesará la devolución de
                fondos cuando se demuestre que el cobro fue duplicado por
                error técnico de la pasarela de pago, o cuando el pago se haya
                realizado de forma anticipada y el servicio no haya podido
                prestarse por causa atribuible de manera directa y exclusiva a
                la infraestructura de Alia Coaching Services LLC.
            </p>

            <h3>
                3.8. Corresponsabilidad del Usuario, compromisos prácticos y
                facultad de suspensión
            </h3>
            <p>
                Según el criterio profesional y las necesidades del proceso,
                los Facilitadores quedan facultados para determinar ejercicios
                prácticos, lecturas, registros de hábitos o actividades entre
                sesiones. Alia Coaching Services LLC no garantiza resultados
                específicos ni metas cuantificables, ya que el progreso
                depende del esfuerzo e integración individual del Usuario. La
                falta de avances atribuible a la no realización, abandono o
                ejecución deficiente de las actividades pautadas será de la
                exclusiva responsabilidad del Usuario. En caso de
                incumplimiento reiterado que impida la evolución del proceso,
                Alia Coaching Services LLC y sus Facilitadores se reservan el
                derecho de suspender o dar por finalizada la prestación del
                servicio, sin que esto genere responsabilidad ni penalidad
                legal para la empresa.
            </p>

            <h2>
                4. Código de conducta, confidencialidad, derechos,
                obligaciones y protocolo anti-acoso
            </h2>

            <h3>4.1. Marco de respeto recíproco</h3>
            <p>
                Las interacciones dentro de la Plataforma, canalizadas por
                videollamada, chat, correo o mensajería (WhatsApp), se
                fundamentan en el respeto mutuo, la ética profesional, la
                dignidad humana y la cordialidad. Alia Coaching Services LLC
                mantiene una política de tolerancia cero ante cualquier
                conducta hostil, vejatoria o inadecuada.
            </p>

            <h3>4.2. Obligaciones y compromisos generales del Usuario</h3>
            <ul>
                <li>
                    <strong>a)</strong> Conectarse a las sesiones en
                    condiciones óptimas: entorno privado, libre de
                    distracciones, con conexión estable a internet, y sin
                    encontrarse bajo el efecto de sustancias psicoactivas o
                    alcohol.
                </li>
                <li>
                    <strong>b)</strong> Guardar el debido respeto:
                    abstenerse de utilizar lenguaje obsceno, ofensivo,
                    discriminatorio, amenazante o intimidatorio hacia los
                    Facilitadores o personal de la Plataforma.
                </li>
                <li>
                    <strong>c)</strong> Mantener el encuadre del servicio:
                    respetar los horarios de inicio y fin, así como los
                    canales oficiales acordados para la comunicación, sin
                    exigir atención fuera de los espacios pautados.
                </li>
            </ul>

            <h3>4.3. Obligaciones y compromisos del Facilitador / Especialista</h3>
            <ul>
                <li>
                    <strong>a) Imparcialidad y profesionalismo:</strong>{" "}
                    brindar un espacio seguro, empático y libre de juicios de
                    valor.
                </li>
                <li>
                    <strong>b) Puntualidad:</strong> conectarse puntualmente a
                    la sala virtual asignada para la consulta.
                </li>
                <li>
                    <strong>c) Ética y secreto profesional:</strong> mantener
                    la debida reserva sobre la información personal y
                    emocional compartida por el Usuario durante el proceso.
                </li>
            </ul>

            <h3>
                4.4. Confidencialidad, prohibición general de grabación y
                excepción de evidencia
            </h3>
            <p>
                El contenido de las sesiones es estrictamente confidencial
                entre el Usuario y el Facilitador. Queda prohibida la
                grabación total o parcial, captura de pantalla, transmisión
                en vivo o difusión por cualquier medio de las sesiones
                virtuales o comunicaciones escritas sin autorización previa.
            </p>
            <p>
                Esta prohibición no aplicará en aquellos casos en los que
                exista una violación grave a los presentes Términos y
                Condiciones, acoso, conductas obscenas, amenazas o la
                eventual comisión de un delito. En tales supuestos, y de
                conformidad con la legislación del Estado de Wyoming, el RGPD
                (Art. 6.1.f) y las leyes de privacidad aplicables al
                consumidor (incluyendo la CCPA, Cal. Civ. Code §
                1798.105(d)), el Facilitador y Alia Coaching Services LLC
                quedan facultados para recabar, documentar y conservar los
                elementos probatorios necesarios (incluyendo registros de
                chat, capturas o material de respaldo) con el fin exclusivo de
                ejercer la defensa legal de la empresa, sustentar el reporte
                de incidentes e interponer las acciones judiciales o
                administrativas correspondientes. En estricto cumplimiento del
                principio de limitación de la finalidad (RGPD Art. 5.1.b),
                dicha información no será utilizada bajo ninguna circunstancia
                con fines comerciales, publicitarios ni de difusión masiva.
            </p>

            <h3>4.5. Protocolo anti-acoso, hostigamiento y conductas inapropiadas</h3>
            <p>Se prohíbe de forma categórica:</p>
            <ul>
                <li>
                    <strong>a)</strong> Acoso sexual o insinuaciones de
                    naturaleza romántica, sexual o íntima por parte del
                    Usuario hacia el Facilitador, o viceversa.
                </li>
                <li>
                    <strong>b)</strong> Exposición indecente, desnudez o
                    actos obscenos en cámara durante las videollamadas.
                </li>
                <li>
                    <strong>c)</strong> Comentarios de odio, discriminación
                    por raza, género, orientación sexual, religión o
                    nacionalidad.
                </li>
                <li>
                    <strong>d)</strong> Solicitudes o exigencias financieras,
                    préstamos o intercambios personales ajenos a la tarifa
                    oficial.
                </li>
            </ul>

            <h3>4.6. Medidas disciplinarias, protocolo de incidentes y suspensión</h3>
            <p>
                El Facilitador queda facultado para dar por terminada la
                sesión de forma inmediata, registrando el incidente en el
                sistema de la Plataforma mediante un informe técnico formal.
                La decisión de suspensión se fundamentará en el reporte
                detallado del Facilitador, las evidencias recabadas conforme
                al punto 4.4 y los registros de auditoría del sistema, los
                cuales constituirán evidencia suficiente para respaldar la
                terminación de la relación contractual sin derecho a
                reembolso ni reclamo por negativa de servicio. Alia Coaching
                Services LLC procederá al bloqueo definitivo de la cuenta del
                Usuario, reservándose el derecho de interponer las acciones
                civiles o penales pertinentes ante las autoridades
                competentes.
            </p>

            <h2>
                5. Propiedad intelectual, exención por fallas tecnológicas e
                indemnización
            </h2>

            <h3>5.1. Titularidad de la propiedad intelectual</h3>
            <p>
                Todos los contenidos, marcas comerciales, nombres comerciales,
                logotipos, diseños, textos, gráficos, material audiovisual,
                guías de trabajo, plantillas, metodologías y software
                integrados en la Plataforma son propiedad exclusiva de Alia
                Coaching Services LLC o de sus respectivos licenciantes, y se
                encuentran protegidos por la Ley de Derechos de Autor de los
                Estados Unidos (U.S. Copyright Act, Title 17 U.S.C.), la Ley
                Digital del Milenio (DMCA - 17 U.S.C. § 512) y los tratados
                internacionales de propiedad intelectual.
            </p>

            <h3>5.2. Licencia limitada al Usuario</h3>
            <p>
                Alia Coaching Services LLC otorga al Usuario una licencia
                limitada, personal, revocable, no exclusiva, no transferible
                y no sublicenciable para acceder y hacer uso personal y no
                comercial de los materiales educativos o guías de apoyo
                provistas durante su proceso. Queda estrictamente prohibida la
                reproducción, distribución, modificación, venta, alquiler,
                transmisión, ingeniería inversa o explotación comercial de
                cualquier contenido de la Plataforma sin el consentimiento
                previo, explícito y por escrito de Alia Coaching Services
                LLC.
            </p>

            <h3>5.3. Exención de responsabilidad y remedio exclusivo por fallas tecnológicas</h3>
            <p>
                Alia Coaching Services LLC realiza esfuerzos técnicamente
                razonables para mantener la continuidad del servicio, pero no
                garantiza la ausencia absoluta de interrupciones o fallas
                técnicas ajenas a su control directo. Si la consulta no puede
                realizarse o se interrumpe por fallas en la conexión,
                dispositivos o energía eléctrica del Usuario, la sesión se
                considerará ejecutada o sujeta a las políticas de cancelación
                tardía del punto 3.5. Si la sesión se interrumpe o no puede
                iniciarse por fallas técnicas atribuibles al Facilitador o a
                la infraestructura de la Plataforma, la única y exclusiva
                responsabilidad de Alia Coaching Services LLC será agendar la
                reprogramación de la cita sin costo adicional. En ningún caso
                la empresa responderá por daños indirectos, lucro cesante o
                indemnizaciones por el diferimiento de la consulta.
            </p>

            <h3>5.4. Indemnización a favor de Alia Coaching Services LLC</h3>
            <p>
                El Usuario se compromete a defender, indemnizar y mantener
                libre de toda responsabilidad, daño, pérdida, reclamo, multa o
                gasto (incluyendo honorarios razonables de abogados) a Alia
                Coaching Services LLC, sus directores, cofundadores,
                empleados, Facilitadores y agentes, derivados de: (a) el
                incumplimiento o violación por parte del Usuario de cualquier
                cláusula de estos Términos; (b) el uso indebido o fraudulento
                de la Plataforma o de los servicios de pago; (c) la violación
                de cualquier derecho de terceros, incluyendo derechos de
                privacidad, propiedad intelectual o confidencialidad; y (d)
                informaciones falsas, inexactas o engañosas suministradas por
                el Usuario durante su registro o dentro del proceso de
                atención.
            </p>

            <h2>
                6. Protección de datos, modificaciones, ley aplicable y
                disposiciones finales
            </h2>

            <h3>
                6.1. Protección de datos personales, privacidad y
                transferencia internacional
            </h3>
            <p>
                El tratamiento de los datos personales suministrados por el
                Usuario se rige por la{" "}
                <a href="/privacidad">Política de Privacidad</a> de Alia
                Coaching Services LLC. La empresa garantiza el cumplimiento de
                los principios de confidencialidad, seguridad, limitación de
                la finalidad y transparencia, en estricta conformidad con el
                RGPD, la CCPA y la normativa aplicable del Estado de Wyoming.
                Los datos de bienestar y de registro serán utilizados
                exclusivamente para la gestión de las sesiones, facturación y
                mejora del servicio, sin que puedan ser comercializados o
                transferidos a terceros no autorizados. Al utilizar la
                Plataforma, el Usuario autoriza explícitamente la
                transferencia internacional y el alojamiento de sus datos en
                servidores e infraestructura tecnológica ubicados en los
                Estados Unidos de América.
            </p>

            <h3>
                6.1.1. Tecnologías de rastreo, analítica y publicidad digital
                (Google Ads, Google Analytics y Meta)
            </h3>
            <p>
                La Plataforma utiliza tecnologías de seguimiento, cookies de
                sesión, etiquetas de conversión y remarketing, que recopilan
                información seudonimizada y agregada (dirección IP
                anonimizada, tipo de dispositivo, interacción con anuncios y
                páginas visitadas) con el propósito de medir la efectividad de
                las campañas publicitarias en Google Ads y Meta Ads, analizar
                el tráfico web y mostrar contenidos relevantes basados en la
                navegación previa. El Usuario mantiene en todo momento el
                derecho de configurar, rechazar o deshabilitar las cookies a
                través del{" "}
                <a href="/cookies">panel de preferencias de la Plataforma</a>{" "}
                o de su navegador, así como de inhabilitar la personalización
                de anuncios de Google en{" "}
                <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    adssettings.google.com
                </a>
                .
            </p>

            <h3>6.2. Modificaciones y actualizaciones de los Términos</h3>
            <p>
                Alia Coaching Services LLC se reserva la facultad de
                modificar, actualizar o reformar los presentes Términos en
                cualquier momento para adaptarlos a novedades legislativas,
                operativas, financieras o tecnológicas. Cualquier
                modificación sustancial será notificada a los Usuarios
                registrados a través de correo electrónico, mensajería
                instantánea (WhatsApp) o avisos visibles en la Plataforma con
                un mínimo de quince (15) días de anticipación a su entrada en
                vigor. El uso continuado de los servicios posterior a la
                fecha de entrada en vigencia constituirá la aceptación plena,
                inequívoca e incondicional de los Términos modificados.
            </p>

            <h3>6.3. Divisibilidad y nulidad parcial (severability)</h3>
            <p>
                Si cualquier cláusula, disposición o apartado de los
                presentes Términos fuere declarado nulo, inválido, ineficaz o
                inejecutable por un tribunal o autoridad competente, dicha
                declaración no afectará la validez ni la ejecutabilidad de
                las demás cláusulas.
            </p>

            <h3>6.4. Ley aplicable y jurisdicción competente</h3>
            <p>
                Los presentes Términos se regirán e interpretarán conforme a
                las leyes del Estado de Wyoming, Estados Unidos de América.
                En caso de Usuarios que actúen como consumidores residentes en
                la Unión Europea, se respetarán las disposiciones imperativas
                de protección al consumidor de su país de residencia (Art.
                6.2 del Reglamento (CE) N° 593/2008, Roma I). Para la
                resolución de cualquier controversia se someten a la
                jurisdicción de los tribunales competentes del Estado de
                Wyoming, EE. UU., sin perjuicio de que los Usuarios
                consumidores residentes en la Unión Europea puedan optar por
                presentar sus reclamaciones ante los tribunales del Estado
                miembro de su domicilio (Arts. 18.1 y 19 del Reglamento (UE)
                N° 1215/2012, Bruselas I Bis, y Directiva 93/13/CEE).
            </p>

            <h3>6.5. Integridad contractual y acuerdo completo</h3>
            <p>
                Los presentes Términos y Condiciones, junto con la Política
                de Privacidad y el Consentimiento Informado, constituyen el
                acuerdo completo, único e indivisible entre el Usuario y Alia
                Coaching Services LLC en relación con el objeto aquí
                estipulado, reemplazando y dejando sin efecto cualquier
                acuerdo, conversación, oferta o negociación previa, ya sea
                verbal o escrita.
            </p>

            <h3>6.6. Canales oficiales de notificación, atención y soporte</h3>
            <p>
                Para cualquier comunicación, solicitud de revocación,
                ejercicio de derechos de privacidad (RGPD/CCPA), consultas
                contractuales o soporte operativo, dirígete formalmente a
                nuestros canales oficiales:
            </p>
            <ul>
                <li>
                    Atención general, notificaciones contractuales y legales:{" "}
                    <a href="mailto:contacto@aliabienestar.com">
                        contacto@aliabienestar.com
                    </a>
                </li>
                <li>
                    Soporte técnico, gestión de pagos y agendamiento:{" "}
                    <a href="mailto:soporte@aliabienestar.com">
                        soporte@aliabienestar.com
                    </a>
                </li>
            </ul>
            <p>
                Cualquier notificación enviada a direcciones distintas a las
                aquí indicadas no surtirá efectos jurídicos ni contractuales
                para Alia Coaching Services LLC.
            </p>
        </LegalPageLayout>
    );
}
