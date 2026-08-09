import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/legal-page-layout";
import { CURRENT_INFORMED_CONSENT_VERSION } from "@/lib/legal/informed-consent";

export const metadata: Metadata = {
    title: "Consentimiento Informado | ALIA",
};

export default function ConsentimientoInformadoPage() {
    return (
        <LegalPageLayout title="Consentimiento Informado de Acompañamiento Emocional, Desarrollo Personal y Coaching para Adultos">
            <p className="text-xs text-muted-foreground">
                Versión {CURRENT_INFORMED_CONSENT_VERSION}
            </p>

            <p>
                Por medio del presente documento, Alia Coaching Services LLC
                ofrece servicios de coaching, acompañamiento emocional,
                desarrollo personal y coaching situacional, orientados a
                proporcionar a la persona usuaria un espacio virtual de
                conversación, reflexión y acompañamiento para explorar
                situaciones de su vida, identificar objetivos, reconocer
                recursos personales y desarrollar alternativas o estrategias que
                puedan contribuir a su bienestar y crecimiento personal. El
                servicio puede abordar, de acuerdo con las necesidades y
                objetivos planteados por la persona usuaria, aspectos
                relacionados con el autoconocimiento, gestión emocional,
                hábitos, organización personal, establecimiento de metas, toma
                de decisiones, comunicación, relaciones interpersonales,
                autoestima, motivación y desarrollo de habilidades personales,
                entre otros temas relacionados con el desarrollo y bienestar
                individual.
            </p>

            <h2>Aporte del servicio</h2>
            <p>
                La persona usuaria comprende que el coaching y el acompañamiento
                pueden contribuir a favorecer la claridad respecto de sus
                objetivos, el autoconocimiento, la identificación de recursos
                personales, la reflexión sobre diferentes situaciones, el
                desarrollo de nuevas perspectivas y la puesta en práctica de
                estrategias orientadas al crecimiento y bienestar personal. No
                obstante, la persona usuaria comprende y acepta que el servicio
                no garantiza resultados específicos, cambios determinados ni el
                cumplimiento de metas concretas, debido a que los avances y
                resultados dependen, entre otros factores, de las circunstancias
                particulares, la participación activa, la disposición para
                reflexionar y la integración de las herramientas y actividades
                propuestas durante el proceso.
            </p>

            <h2>Participación y compromiso</h2>
            <p>
                La persona usuaria comprende que el aprovechamiento del servicio
                requiere de su participación activa, compromiso voluntario y
                continuidad. Como parte del proceso de acompañamiento, el
                Facilitador podrá proponer, cuando lo considere pertinente,
                ejercicios prácticos, lecturas, registros de hábitos,
                actividades de reflexión u otras dinámicas destinadas a
                complementar el trabajo realizado durante las sesiones. La
                persona usuaria comprende que la realización de estas
                actividades puede contribuir al desarrollo del proceso y que la
                falta de participación, continuidad o realización de los
                compromisos propuestos puede limitar los avances esperados.
                Asimismo, reconoce que las decisiones, acciones y resultados que
                se produzcan a partir del proceso corresponden a sus propias
                circunstancias y elecciones personales.
            </p>

            <h2>Modalidad y duración del servicio</h2>
            <p>
                Las sesiones se desarrollarán de manera virtual, mediante
                plataformas de videoconferencia cifradas (Google Meet, Zoom o la
                plataforma que Alia Coaching Services LLC determine para la
                prestación del servicio). Cada sesión tendrá una duración de
                sesenta (60) minutos, salvo que se acuerde expresamente una
                duración diferente entre las partes. Se establece un tiempo
                máximo de espera de quince (15) minutos a partir de la hora
                agendada; transcurrido dicho lapso sin la reconexión o ingreso
                del usuario, la sesión se considerará consumida.
            </p>

            <h2>Aspectos a considerar y deslinde clínico</h2>
            <p>
                La persona usuaria comprende que los procesos de reflexión y
                desarrollo personal pueden implicar momentos de incomodidad,
                cuestionamiento, incertidumbre o confrontación con pensamientos,
                emociones, hábitos o situaciones personales. Estas experiencias
                forman parte de las posibilidades propias de un espacio
                orientado a la reflexión y al cambio personal. La persona
                usuaria comprende igualmente que el servicio no proporciona
                soluciones automáticas y que la participación en el mismo no
                constituye una garantía de modificación de una situación
                personal determinada. Los servicios ofrecidos por Alia Coaching
                Services LLC están destinados exclusivamente al bienestar
                emocional, desarrollo personal y coaching situacional. No
                constituyen servicios médicos, psiquiátricos, psicológicos
                clínicos, diagnósticos, psicoterapéuticos ni de tratamiento, ni
                sustituyen la atención especializada que pueda requerirse según
                las circunstancias particulares de la persona usuaria.
            </p>

            <h2>Protocolos de emergencia y atención en crisis</h2>
            <p>
                La persona usuaria reconoce y acepta que la Plataforma y sus
                Facilitadores no prestan servicios de urgencia ni atención
                médica o psiquiátrica de emergencia. En caso de presentar una
                crisis de salud mental, ideación suicida o emergencia médica, la
                persona usuaria se compromete a acudir inmediatamente a un
                centro de salud o comunicarse con los servicios de emergencia de
                su localidad.
            </p>

            <h2>Aceptación y consentimiento</h2>
            <p>
                La persona usuaria declara haber recibido información suficiente
                y comprensible sobre la naturaleza, finalidad, características,
                posibles aportes y aspectos a considerar respecto del servicio
                de coaching, acompañamiento emocional y bienestar ofrecido por
                Alia Coaching Services LLC. Asimismo, declara haber tenido la
                oportunidad de revisar los Términos y Condiciones de Uso y
                Servicio, la Política de Privacidad y las demás disposiciones
                aplicables, comprendiendo que dichos documentos, junto con el
                presente consentimiento, constituyen el marco legal regulatorio
                aplicable.
            </p>
            <p>
                Mediante la selección del checkbox correspondiente, la persona
                usuaria manifiesta de manera libre, expresa y voluntaria que:
            </p>
            <ol>
                <li>
                    Ha leído y comprendido la información contenida en el
                    presente documento.
                </li>
                <li>
                    Comprende la naturaleza y finalidad del servicio de
                    coaching, acompañamiento emocional y desarrollo personal.
                </li>
                <li>
                    Comprende sus posibles aportes y los aspectos que debe
                    considerar antes de participar.
                </li>
                <li>Comprende que no se garantizan resultados específicos.</li>
                <li>
                    Acepta participar activamente en el proceso y asumir
                    responsabilidad por sus propias decisiones y acciones.
                </li>
                <li>
                    Ha leído y acepta íntegramente los Términos y Condiciones de
                    Uso y Servicio, así como la Política de Privacidad de Alia
                    Coaching Services LLC.
                </li>
            </ol>
            <p>
                La aceptación electrónica mediante la selección del checkbox
                constituye la manifestación expresa de voluntad de la persona
                usuaria de recibir el servicio y aceptar las condiciones
                aplicables al mismo.
            </p>
        </LegalPageLayout>
    );
}
