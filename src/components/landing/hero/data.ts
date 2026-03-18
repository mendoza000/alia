import { ShieldCheck, Lock, CalendarClock } from "lucide-react";
import type { BentoCard } from "./types";

export const bentoCards: BentoCard[] = [
    {
        id: "photo-1",
        type: "photo",
        name: "Dra. María C.",
        specialty: "Psicología Clínica",
        imgUrl: "https://plus.unsplash.com/premium_photo-1670884441862-ddb29ed1f25e?w=400&h=600&fit=crop&crop=face",
        className:
            "aspect-[3/2] sm:aspect-[4/5] sm:col-span-1 md:aspect-auto md:col-start-1 md:row-start-1 md:row-span-2",
    },
    {
        id: "value-1",
        type: "value",
        title: "Profesionales verificados",
        description:
            "Cada psicólogo en nuestra plataforma pasa por un proceso riguroso de verificación que incluye validación de título universitario, registro profesional activo y experiencia clínica comprobada.",
        supportImg: "/support/support-img-6.png",
        bg: "bg-card",
        className: "col-span-1 md:col-start-2 md:col-span-2 md:row-start-1",
        icon: ShieldCheck,
        highlights: [
            "Título universitario",
            "Registro profesional activo",
            "Experiencia clínica comprobada",
        ],
    },
    {
        id: "value-2",
        type: "value",
        title: "100% confidencial",
        description: "Tu información y sesiones son completamente privadas.",
        supportImg: "/support/support-img-5.png",
        bg: "bg-secondary/40",
        className: "col-span-1 md:col-start-2 md:row-start-2",
        icon: Lock,
        highlights: ["Datos encriptados", "Sesiones privadas"],
    },
    {
        id: "decorative",
        type: "decorative",
        supportImg: "/support/support-img-3.png",
        bg: "bg-accent/15",
        className: "col-span-1 hidden md:block md:col-start-3 md:row-start-2",
    },
    {
        id: "value-3",
        type: "value",
        title: "Agenda en minutos",
        description:
            "Reservar tu cita es simple: elige el horario que mejor te funcione, completa un breve formulario sobre ti y confirma tu sesión — todo desde la comodidad de tu celular o computador.",
        supportImg: "/support/support-img-2.png",
        bg: "bg-card",
        className: "sm:col-span-2 md:col-start-1 md:col-span-2 md:row-start-3",
        icon: CalendarClock,
        highlights: [
            "Elige horario",
            "Completa formulario",
            "Confirma tu cita",
        ],
    },
    {
        id: "photo-2",
        type: "photo",
        name: "Dr. Juan R.",
        specialty: "Terapia de Pareja",
        imgUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=600&fit=crop&crop=face",
        className:
            "aspect-[3/2] sm:aspect-[4/5] sm:col-span-1 md:aspect-auto md:col-start-3 md:row-start-3 md:min-h-[180px]",
    },
];

export const avatarGradients = [
    "bg-gradient-to-br from-accent/60 to-secondary",
    "bg-gradient-to-br from-secondary to-accent/40",
    "bg-gradient-to-br from-accent/30 to-secondary/80",
];
