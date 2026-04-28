"use server";

import { prisma } from "@/lib/prisma";
import { requireAcademyAccess, requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AvailabilityFormState = {
  success: boolean;
  error?: string;
};

export type AvailabilitySlot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes: string | null;
  userId: string;
  userName: string;
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const AvailabilitySchema = z.object({
  date:        z.string().min(1, "Fecha requerida"),
  startTime:   z.string().min(1, "Hora de inicio requerida"),
  endTime:     z.string().min(1, "Hora de fin requerida"),
  isAvailable: z.string().optional(),
  notes:       z.string().optional(),
});

// ─── Guardar disponibilidad (árbitro) ─────────────────────────────────────────

export async function saveAvailability(
  academyId: string,
  userId: string,
  formData: FormData
): Promise<AvailabilityFormState> {
  await requireAcademyAccess(academyId);

  const raw = {
    date:        formData.get("date"),
    startTime:   formData.get("startTime"),
    endTime:     formData.get("endTime"),
    isAvailable: formData.get("isAvailable") ?? "true",
    notes:       formData.get("notes") || undefined,
  };

  const parsed = AvailabilitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const data = parsed.data;

  if (data.endTime <= data.startTime) {
    return { success: false, error: "La hora de fin debe ser después de la hora de inicio" };
  }

  await prisma.availability.upsert({
    where: {
      userId_academyId_date: {
        userId,
        academyId,
        date: new Date(data.date),
      },
    },
    create: {
      userId,
      academyId,
      date:        new Date(data.date),
      startTime:   data.startTime,
      endTime:     data.endTime,
      isAvailable: data.isAvailable !== "false",
      notes:       data.notes ?? null,
    },
    update: {
      startTime:   data.startTime,
      endTime:     data.endTime,
      isAvailable: data.isAvailable !== "false",
      notes:       data.notes ?? null,
    },
  });

  revalidatePath(`/${academyId}/availability`);
  return { success: true };
}

// ─── Guardar múltiples días de disponibilidad (rango) ────────────────────────

export async function saveAvailabilityRange(
  academyId: string,
  userId: string,
  dates: string[],
  startTime: string,
  endTime: string,
  isAvailable: boolean,
  notes?: string
): Promise<AvailabilityFormState> {
  await requireAcademyAccess(academyId);

  if (!dates.length) return { success: false, error: "Selecciona al menos un día" };
  if (endTime <= startTime) return { success: false, error: "La hora de fin debe ser después de la hora de inicio" };

  // Upsert para cada fecha seleccionada
  await Promise.all(
    dates.map((dateStr) =>
      prisma.availability.upsert({
        where: {
          userId_academyId_date: {
            userId,
            academyId,
            date: new Date(dateStr),
          },
        },
        create: {
          userId,
          academyId,
          date:        new Date(dateStr),
          startTime,
          endTime,
          isAvailable,
          notes:       notes ?? null,
        },
        update: {
          startTime,
          endTime,
          isAvailable,
          notes: notes ?? null,
        },
      })
    )
  );

  revalidatePath(`/${academyId}/availability`);
  return { success: true };
}

// ─── Eliminar disponibilidad de un día ───────────────────────────────────────

export async function deleteAvailability(
  academyId: string,
  availabilityId: string
): Promise<AvailabilityFormState> {
  await requireAcademyAccess(academyId);

  await prisma.availability.delete({
    where: { id: availabilityId },
  });

  revalidatePath(`/${academyId}/availability`);
  return { success: true };
}

// ─── Obtener disponibilidad del árbitro en un rango ──────────────────────────

export async function getMyAvailability(
  academyId: string,
  userId: string,
  from: Date,
  to: Date
): Promise<AvailabilitySlot[]> {
  await requireAcademyAccess(academyId);

  const records = await prisma.availability.findMany({
    where: {
      userId,
      academyId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
  });

  return records.map((r) => ({
    id:          r.id,
    date:        r.date,
    startTime:   r.startTime,
    endTime:     r.endTime,
    isAvailable: r.isAvailable,
    notes:       r.notes,
    userId:      r.userId,
    userName:    "",
  }));
}

// ─── Obtener disponibilidad de todos los árbitros (admin) ────────────────────

export async function getTeamAvailability(
  academyId: string,
  from: Date,
  to: Date
): Promise<AvailabilitySlot[]> {
  await requireAdminRole(academyId);

  const records = await prisma.availability.findMany({
    where: {
      academyId,
      date: { gte: from, lte: to },
    },
    include: {
      user: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return records.map((r) => ({
    id:          r.id,
    date:        r.date,
    startTime:   r.startTime,
    endTime:     r.endTime,
    isAvailable: r.isAvailable,
    notes:       r.notes,
    userId:      r.userId,
    userName:    r.user.name,
  }));
}

// ─── Filtrar árbitros disponibles en fecha y hora específica (admin) ──────────

export async function getAvailableReferees(
  academyId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ userId: string; userName: string; startTime: string; endTime: string; notes: string | null }[]> {
  await requireAdminRole(academyId);

  const records = await prisma.availability.findMany({
    where: {
      academyId,
      date:        new Date(date),
      isAvailable: true,
      startTime:   { lte: startTime },
      endTime:     { gte: endTime },
    },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return records.map((r) => ({
    userId:    r.userId,
    userName:  r.user.name,
    startTime: r.startTime,
    endTime:   r.endTime,
    notes:     r.notes,
  }));
}
