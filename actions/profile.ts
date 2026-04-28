"use server";

import { prisma } from "@/lib/prisma";
import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ProfileFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const ProfileSchema = z.object({
  firstName:      z.string().min(2, "Nombres requeridos"),
  lastName:       z.string().min(2, "Apellidos requeridos"),
  documentType:   z.string().optional(),
  documentNumber: z.string().optional(),
  birthDate:      z.string().optional(),
  phone:          z.string().optional(),
  phone2:         z.string().optional(),
  licenseNumber:  z.string().optional(),
});

export async function updateMyProfile(
  academyId: string,
  formData: FormData
): Promise<ProfileFormState> {
  await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return { success: false, error: "Usuario no encontrado" };

  const raw = {
    firstName:      formData.get("firstName"),
    lastName:       formData.get("lastName"),
    documentType:   formData.get("documentType") || undefined,
    documentNumber: formData.get("documentNumber") || undefined,
    birthDate:      formData.get("birthDate") || undefined,
    phone:          formData.get("phone") || undefined,
    phone2:         formData.get("phone2") || undefined,
    licenseNumber:  formData.get("licenseNumber") || undefined,
  };

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name:           fullName,
      firstName:      data.firstName,
      lastName:       data.lastName,
      documentType:   data.documentType ?? null,
      documentNumber: data.documentNumber ?? null,
      birthDate:      data.birthDate ? new Date(data.birthDate) : null,
      phone:          data.phone ?? null,
      phone2:         data.phone2 ?? null,
      licenseNumber:  data.licenseNumber ?? null,
    },
  });

  revalidatePath(`/${academyId}/profile`);
  return { success: true };
}
