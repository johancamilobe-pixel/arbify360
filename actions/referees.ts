"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AddRefereeSchema = z.object({
  email:             z.string().email("Email inválido"),
  firstName:         z.string().min(2, "Nombres requeridos"),
  lastName:          z.string().min(2, "Apellidos requeridos"),
  documentType:      z.string().optional(),
  documentNumber:    z.string().optional(),
  birthDate:         z.string().optional(),
  phone:             z.string().optional(),
  phone2:            z.string().optional(),
  licenseNumber:     z.string().optional(),
  refereeCategoryId: z.string().optional(),
});

const UpdateRefereeSchema = z.object({
  email:             z.string().email("Email inválido"),
  firstName:         z.string().min(2, "Nombres requeridos"),
  lastName:          z.string().min(2, "Apellidos requeridos"),
  documentType:      z.string().optional(),
  documentNumber:    z.string().optional(),
  birthDate:         z.string().optional(),
  phone:             z.string().optional(),
  phone2:            z.string().optional(),
  licenseNumber:     z.string().optional(),
  refereeCategoryId: z.string().optional(),
});

export type RefereeFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function buildFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

// ─── Registrar árbitro ───────────────────────────────────────────────────────

export async function addReferee(
  academyId: string,
  formData: FormData
): Promise<RefereeFormState> {
  await requireAdminRole(academyId);

  const raw = {
    email:             formData.get("email"),
    firstName:         formData.get("firstName"),
    lastName:          formData.get("lastName"),
    documentType:      formData.get("documentType") || undefined,
    documentNumber:    formData.get("documentNumber") || undefined,
    birthDate:         formData.get("birthDate") || undefined,
    phone:             formData.get("phone") || undefined,
    phone2:            formData.get("phone2") || undefined,
    licenseNumber:     formData.get("licenseNumber") || undefined,
    refereeCategoryId: formData.get("refereeCategoryId") || undefined,
  };

  const parsed = AddRefereeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const fullName = buildFullName(data.firstName, data.lastName);

  let user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email:          data.email,
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
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name:           fullName,
        firstName:      data.firstName,
        lastName:       data.lastName,
        documentType:   data.documentType ?? user.documentType,
        documentNumber: data.documentNumber ?? user.documentNumber,
        birthDate:      data.birthDate ? new Date(data.birthDate) : user.birthDate,
        phone:          data.phone ?? user.phone,
        phone2:         data.phone2 ?? user.phone2,
        licenseNumber:  data.licenseNumber ?? user.licenseNumber,
      },
    });
  }

  const existing = await prisma.academyMembership.findUnique({
    where: { userId_academyId: { userId: user.id, academyId } },
  });

  if (existing) {
    return { success: false, error: "Este árbitro ya pertenece a esta academia" };
  }

  await prisma.academyMembership.create({
    data: {
      userId:            user.id,
      academyId,
      role:              "REFEREE",
      refereeCategoryId: data.refereeCategoryId || null,
      isActive:          true,
    },
  });

  revalidatePath(`/${academyId}/referees`);
  return { success: true };
}

// ─── Actualizar árbitro ──────────────────────────────────────────────────────

export async function updateReferee(
  academyId: string,
  userId: string,
  formData: FormData
): Promise<RefereeFormState> {
  await requireAdminRole(academyId);

  const raw = {
    email:             formData.get("email"),
    firstName:         formData.get("firstName"),
    lastName:          formData.get("lastName"),
    documentType:      formData.get("documentType") || undefined,
    documentNumber:    formData.get("documentNumber") || undefined,
    birthDate:         formData.get("birthDate") || undefined,
    phone:             formData.get("phone") || undefined,
    phone2:            formData.get("phone2") || undefined,
    licenseNumber:     formData.get("licenseNumber") || undefined,
    refereeCategoryId: formData.get("refereeCategoryId") || undefined,
  };

  const parsed = UpdateRefereeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const fullName = buildFullName(data.firstName, data.lastName);

  if (data.email) {
    const emailInUse = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (emailInUse) {
      return { success: false, fieldErrors: { email: ["Este email ya está en uso por otro usuario"] } };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      email:          data.email,
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

  await prisma.academyMembership.update({
    where: { userId_academyId: { userId, academyId } },
    data: {
      refereeCategoryId: data.refereeCategoryId || null,
    },
  });

  revalidatePath(`/${academyId}/referees`);
  revalidatePath(`/${academyId}/referees/${userId}`);
  return { success: true };
}

// ─── Desactivar / Reactivar ──────────────────────────────────────────────────

export async function deactivateReferee(academyId: string, userId: string): Promise<RefereeFormState> {
  await requireAdminRole(academyId);
  await prisma.academyMembership.update({
    where: { userId_academyId: { userId, academyId } },
    data: { isActive: false },
  });
  revalidatePath(`/${academyId}/referees`);
  return { success: true };
}

export async function reactivateReferee(academyId: string, userId: string): Promise<RefereeFormState> {
  await requireAdminRole(academyId);
  await prisma.academyMembership.update({
    where: { userId_academyId: { userId, academyId } },
    data: { isActive: true },
  });
  revalidatePath(`/${academyId}/referees`);
  return { success: true };
}

// ─── Eliminar múltiples árbitros de la academia ───────────────────────────────

export async function deleteMultipleReferees(
  academyId: string,
  userIds: string[]
): Promise<RefereeFormState> {
  await requireAdminRole(academyId);

  if (userIds.length === 0) return { success: false, error: "No hay árbitros seleccionados" };

  await prisma.academyMembership.deleteMany({
    where: {
      academyId,
      userId: { in: userIds },
      role: "REFEREE",
    },
  });

  revalidatePath(`/${academyId}/referees`);
  return { success: true };
}