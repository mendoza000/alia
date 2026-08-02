"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  intakeFormSchema,
  type IntakeFormData,
} from "@/lib/validators/intake-form";

export async function updateIntakeForm(
  appointmentId: string,
  data: IntakeFormData,
) {
  const validated = await intakeFormSchema.validate(data, {
    abortEarly: false,
  });

  await prisma.intakeForm.update({
    where: { appointmentId },
    data: { data: validated },
  });

  revalidatePath("/admin/formularios", "layout");
  revalidatePath(`/admin/formularios/${appointmentId}`);
}

export async function deleteIntakeForm(appointmentId: string) {
  await prisma.$transaction([
    prisma.intakeForm.delete({ where: { appointmentId } }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "PENDING_FORM",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    }),
  ]);

  revalidatePath("/admin/formularios", "layout");
  revalidatePath("/admin/citas", "layout");
}
