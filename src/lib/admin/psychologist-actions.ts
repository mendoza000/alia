"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import {
  psychologistSchema,
  type PsychologistFormData,
} from "@/lib/validators/psychologist";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uploadPsychologistPhoto(
  formData: FormData,
): Promise<string> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No se proporcionó un archivo");

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato no válido. Usa JPG, PNG o WebP.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen no debe superar los 5 MB.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const name = formData.get("name") as string | null;
  const slug = name ? slugify(name) : "photo";
  const path = `photos/${Date.now()}-${slug}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("psychologist-photos")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Error al subir imagen: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("psychologist-photos").getPublicUrl(path);

  return publicUrl;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createPsychologist(data: PsychologistFormData) {
  const validated = await psychologistSchema.validate(data, {
    abortEarly: false,
  });

  const slug = generateSlug(validated.name);

  // Ensure slug uniqueness
  const existing = await prisma.psychologist.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  await prisma.psychologist.create({
    data: {
      name: validated.name,
      email: validated.email,
      phone: validated.phone || null,
      specialty: validated.specialty,
      bio: validated.bio,
      sessionRate: validated.sessionRate,
      sessionDuration: validated.sessionDuration,
      calendarId: validated.calendarId || null,
      photoUrl: validated.photoUrl || null,
      isActive: validated.isActive,
      slug: finalSlug,
    },
  });

  revalidatePath("/admin/psicologos", "layout");
}

export async function updatePsychologist(
  id: string,
  data: PsychologistFormData,
) {
  const validated = await psychologistSchema.validate(data, {
    abortEarly: false,
  });

  const slug = generateSlug(validated.name);

  // Ensure slug uniqueness (exclude current record)
  const existing = await prisma.psychologist.findFirst({
    where: { slug, NOT: { id } },
  });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  await prisma.psychologist.update({
    where: { id },
    data: {
      name: validated.name,
      email: validated.email,
      phone: validated.phone || null,
      specialty: validated.specialty,
      bio: validated.bio,
      sessionRate: validated.sessionRate,
      sessionDuration: validated.sessionDuration,
      calendarId: validated.calendarId || null,
      photoUrl: validated.photoUrl || null,
      isActive: validated.isActive,
      slug: finalSlug,
    },
  });

  revalidatePath("/admin/psicologos", "layout");
  revalidatePath(`/admin/psicologos/${id}`);
}

export async function deletePsychologist(id: string) {
  await prisma.psychologist.delete({ where: { id } });

  revalidatePath("/admin/psicologos", "layout");
}

export async function togglePsychologistActive(id: string) {
  const psychologist = await prisma.psychologist.findUnique({ where: { id } });
  if (!psychologist) return;

  await prisma.psychologist.update({
    where: { id },
    data: { isActive: !psychologist.isActive },
  });

  revalidatePath("/admin/psicologos", "layout");
  revalidatePath(`/admin/psicologos/${id}`);
}
