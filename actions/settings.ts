"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { success: boolean; error?: string };

// ─── Categorías de Árbitros ───────────────────────────────────────────────────

const CategorySchema = z.object({
  name:        z.string().min(1, "El nombre es requerido").max(50),
  incomePerGame: z.string().optional(), // ratePerGame para categorías de árbitros
});

export async function createRefereeCategory(
  academyId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const parsed = CategorySchema.safeParse({ name: formData.get("name"), incomePerGame: formData.get("incomePerGame") || undefined });
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };

  try {
    await prisma.refereeCategory.create({
      data: {
        academyId,
        name: parsed.data.name.trim(),
        ratePerGame: parsed.data.incomePerGame ? parseFloat(parsed.data.incomePerGame) : null,
      },
    });
    revalidatePath(`/${academyId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ya existe una categoría con ese nombre" };
  }
}

export async function updateRefereeCategory(
  academyId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const parsed = CategorySchema.safeParse({ name: formData.get("name"), incomePerGame: formData.get("incomePerGame") || undefined });
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };

  try {
    await prisma.refereeCategory.update({
      where: { id: categoryId },
      data: {
        name: parsed.data.name.trim(),
        ratePerGame: parsed.data.incomePerGame ? parseFloat(parsed.data.incomePerGame) : null,
      },
    });
    revalidatePath(`/${academyId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ya existe una categoría con ese nombre" };
  }
}

export async function deleteRefereeCategory(
  academyId: string,
  categoryId: string
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  // Verificar si está en uso
  const inUse = await prisma.academyMembership.count({
    where: { refereeCategoryId: categoryId },
  });
  if (inUse > 0) {
    return { success: false, error: `Esta categoría está asignada a ${inUse} árbitro${inUse !== 1 ? "s" : ""}. Reasígnalos antes de eliminarla.` };
  }
  await prisma.refereeCategory.delete({ where: { id: categoryId } });
  revalidatePath(`/${academyId}/settings`);
  return { success: true };
}

// ─── Categorías de Juego ──────────────────────────────────────────────────────

const GameCategorySchema = z.object({
  name:          z.string().min(1, "El nombre es requerido").max(50),
  incomePerGame: z.string().optional(),
});

export async function createGameCategory(
  academyId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const parsed = GameCategorySchema.safeParse({
    name:          formData.get("name"),
    incomePerGame: formData.get("incomePerGame") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };

  try {
    await prisma.gameCategory.create({
      data: {
        academyId,
        name:          parsed.data.name.trim(),
        incomePerGame: parsed.data.incomePerGame ? parseFloat(parsed.data.incomePerGame) : null,
      },
    });
    revalidatePath(`/${academyId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ya existe una categoría con ese nombre" };
  }
}

export async function updateGameCategory(
  academyId: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const parsed = GameCategorySchema.safeParse({
    name:          formData.get("name"),
    incomePerGame: formData.get("incomePerGame") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };

  try {
    await prisma.gameCategory.update({
      where: { id: categoryId },
      data: {
        name:          parsed.data.name.trim(),
        incomePerGame: parsed.data.incomePerGame ? parseFloat(parsed.data.incomePerGame) : null,
      },
    });
    revalidatePath(`/${academyId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ya existe una categoría con ese nombre" };
  }
}

export async function deleteGameCategory(
  academyId: string,
  categoryId: string
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const inUse = await prisma.game.count({ where: { gameCategoryId: categoryId } });
  if (inUse > 0) {
    return { success: false, error: `Esta categoría está usada en ${inUse} juego${inUse !== 1 ? "s" : ""}. No se puede eliminar.` };
  }
  await prisma.gameCategory.delete({ where: { id: categoryId } });
  revalidatePath(`/${academyId}/settings`);
  return { success: true };
}

// ─── Deportes ─────────────────────────────────────────────────────────────────

export async function toggleSport(
  academyId: string,
  sportId: string,
  active: boolean
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  if (active) {
    try {
      await prisma.academySport.create({ data: { academyId, sportId } });
    } catch {
      // ya existe
    }
  } else {
    // Verificar si está en uso
    const inUse = await prisma.game.count({ where: { academyId, sportId } });
    if (inUse > 0) {
      return { success: false, error: `Este deporte está usado en ${inUse} juego${inUse !== 1 ? "s" : ""}. No se puede desactivar.` };
    }
    await prisma.academySport.deleteMany({ where: { academyId, sportId } });
  }
  revalidatePath(`/${academyId}/settings`);
  return { success: true };
}

// ─── Datos de la academia ─────────────────────────────────────────────────────

const AcademySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
});

export async function updateAcademy(
  academyId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminRole(academyId);
  const parsed = AcademySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };

  await prisma.academy.update({
    where: { id: academyId },
    data: { name: parsed.data.name.trim() },
  });
  revalidatePath(`/${academyId}/settings`);
  return { success: true };
}