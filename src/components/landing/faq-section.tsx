"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "¿Qué es ALIA?",
        answer: "ALIA es una plataforma que conecta personas con psicólogos profesionales verificados. Facilitamos el agendamiento de citas, el proceso de pago y el seguimiento de tu bienestar emocional.",
    },
    {
        question: "¿Cómo agendo una cita?",
        answer: "Elige un psicólogo, selecciona un horario disponible, completa un breve formulario y realiza tu pago en línea. Recibirás una confirmación inmediata por correo electrónico.",
    },
    {
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos tarjetas de crédito, débito y otros métodos de pago en línea a través de Wompi, una pasarela de pagos segura y certificada en Colombia.",
    },
    {
        question: "¿Cuánto dura una sesión?",
        answer: "Las sesiones tienen una duración aproximada de 50 minutos, siguiendo el estándar de la práctica psicológica profesional.",
    },
    {
        question: "¿Puedo cancelar o reagendar mi cita?",
        answer: "Sí, puedes cancelar o reagendar tu cita desde tu cuenta con al menos 24 horas de anticipación sin costo adicional.",
    },
    {
        question: "¿Es confidencial la información que comparto?",
        answer: "Absolutamente. Toda la información que compartas es estrictamente confidencial y está protegida bajo las leyes colombianas de protección de datos personales y el secreto profesional.",
    },
    {
        question: "¿Cómo elijo al psicólogo adecuado para mí?",
        answer: "Cada psicólogo cuenta con un perfil detallado donde puedes conocer su formación, especialidades y enfoque terapéutico. Esto te ayudará a elegir al profesional que mejor se adapte a tus necesidades.",
    },
];

export function FAQSection() {
    return (
        <section
            id="faq"
            className="bg-background px-6 py-20 md:px-12 md:py-28 lg:px-20 xl:px-28 xl:py-36"
        >
            <div className="mx-auto max-w-3xl xl:max-w-4xl">
                <h2 className="text-center font-heading text-3xl md:text-4xl xl:text-5xl">
                    Preguntas frecuentes
                </h2>

                <Accordion className="mt-12">
                    {faqs.map(faq => (
                        <AccordionItem key={faq.question} value={faq.question}>
                            <AccordionTrigger className="py-5 text-base xl:text-lg">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-muted-foreground xl:text-base">
                                    {faq.answer}
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
