import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Strip sslmode from URL (pg driver handles SSL via the ssl option)
const connectionString = process.env.DIRECT_URL?.replace(
  /[?&]sslmode=[^&]*/,
  "",
);
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data (in reverse dependency order)
  await prisma.payment.deleteMany();
  await prisma.intakeForm.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.psychologist.deleteMany();

  // Create psychologists
  const maria = await prisma.psychologist.create({
    data: {
      name: "María Alejandra Torres",
      slug: "maria-alejandra-torres",
      email: "maria.torres@alia.com.co",
      phone: "+57 310 555 1234",
      specialty: "Ansiedad y Depresión",
      bio: "Psicóloga clínica con más de 8 años de experiencia en el tratamiento de trastornos de ansiedad y depresión. Especialista en terapia cognitivo-conductual (TCC) con enfoque en adultos jóvenes. Apasionada por crear un espacio seguro donde cada persona pueda explorar sus emociones y desarrollar herramientas para el bienestar emocional.",
      sessionRate: 120000,
      sessionDuration: 60,
      isActive: true,
      schedules: {
        create: [
          { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
          { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
        ],
      },
    },
  });

  const carlos = await prisma.psychologist.create({
    data: {
      name: "Carlos Andrés Mejía",
      slug: "carlos-andres-mejia",
      email: "carlos.mejia@alia.com.co",
      phone: "+57 315 555 5678",
      specialty: "Terapia de Pareja y Familia",
      bio: "Psicólogo con maestría en terapia familiar sistémica. Más de 10 años ayudando a parejas y familias a mejorar su comunicación y resolver conflictos. Creo firmemente que las relaciones saludables son la base del bienestar emocional. Mi enfoque integra técnicas sistémicas con herramientas prácticas para el día a día.",
      sessionRate: 140000,
      sessionDuration: 60,
      isActive: true,
      schedules: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 2, startTime: "15:00", endTime: "19:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 3, startTime: "15:00", endTime: "19:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
        ],
      },
    },
  });

  const valentina = await prisma.psychologist.create({
    data: {
      name: "Valentina Ríos Hernández",
      slug: "valentina-rios-hernandez",
      email: "valentina.rios@alia.com.co",
      phone: "+57 320 555 9012",
      specialty: "Trauma y Estrés Postraumático",
      bio: "Psicóloga clínica especializada en el abordaje del trauma con enfoque en EMDR y terapia narrativa. Cuento con 6 años de experiencia trabajando con personas que han vivido experiencias difíciles. Mi objetivo es acompañarte en tu proceso de sanación con calidez, respeto y profesionalismo.",
      sessionRate: 130000,
      sessionDuration: 60,
      isActive: true,
      schedules: {
        create: [
          { dayOfWeek: 1, startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: 2, startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: 3, startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: 3, startTime: "16:00", endTime: "20:00" },
          { dayOfWeek: 4, startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: 5, startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: 5, startTime: "16:00", endTime: "20:00" },
        ],
      },
    },
  });

  // Create coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: "BIENVENIDO",
        discountPercent: 20,
        maxUses: 50,
        currentUses: 0,
        expiresAt: new Date("2026-12-31"),
        isActive: true,
      },
      {
        code: "PRIMERACITA",
        discountPercent: 15,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        isActive: true,
      },
    ],
  });

  console.log("Seeded psychologists:");
  console.log(`  - ${maria.name} (${maria.slug})`);
  console.log(`  - ${carlos.name} (${carlos.slug})`);
  console.log(`  - ${valentina.name} (${valentina.slug})`);
  console.log("Seeded 2 coupons: BIENVENIDO (20%), PRIMERACITA (15%)");
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
