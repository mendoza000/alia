export const siteConfig = {
  name: "ALIA",
  url: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  title: "ALIA — Tu psicólogo Aliado",
  description:
    "Agenda tu sesión con psicólogos profesionales en Colombia. Encuentra tu psicólogo aliado y comienza tu proceso de acompañamiento.",
  locale: "es_CO",
} as const;
