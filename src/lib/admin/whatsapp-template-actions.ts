"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireActor, requireScheduleAccess } from "@/lib/auth/require";
import {
    whatsappTemplatesSchema,
    type WhatsappTemplatesFormData,
} from "@/lib/validators/whatsapp-templates";

export async function updateWhatsappTemplates(
    psychologistId: string,
    data: WhatsappTemplatesFormData,
): Promise<void> {
    const actor = await requireActor();
    await requireScheduleAccess(actor, psychologistId);

    const validated = await whatsappTemplatesSchema.validate(data, {
        abortEarly: false,
    });

    await prisma.psychologist.update({
        where: { id: psychologistId },
        data: {
            whatsappReminderTemplate: validated.whatsappReminderTemplate,
            whatsappTodaySessionTemplate:
                validated.whatsappTodaySessionTemplate,
        },
    });

    revalidatePath("/admin/psicologos", "layout");
    revalidatePath(`/admin/psicologos/${psychologistId}`);
    revalidatePath("/admin/mi-calendario");
}
