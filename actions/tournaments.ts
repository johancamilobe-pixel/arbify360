"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type TournamentResult = { success: boolean; error?: string; tournamentId?: string };

const TournamentSchema = z.object({
  name:        z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().optional(),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
});

// ─── Crear torneo ─────────────────────────────────────────────────────────────

export async function createTournament(
  academyId: string,
  formData: FormData
): Promise<TournamentResult> {
  await requireAdminRole(academyId);

  const parsed = TournamentSchema.safeParse({
    name:        formData.get("name"),
    description: formData.get("description") || undefined,
    startDate:   formData.get("startDate") || undefined,
    endDate:     formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };
  }

  const { name, description, startDate, endDate } = parsed.data;

  const tournament = await prisma.tournament.create({
    data: {
      academyId,
      name:        name.trim(),
      description: description?.trim() || null,
      startDate:   startDate ? new Date(startDate) : null,
      endDate:     endDate   ? new Date(endDate)   : null,
      status:      "ACTIVE",
    },
  });

  revalidatePath(`/${academyId}/tournaments`);
  return { success: true, tournamentId: tournament.id };
}

// ─── Editar torneo ────────────────────────────────────────────────────────────

export async function updateTournament(
  academyId: string,
  tournamentId: string,
  formData: FormData
): Promise<TournamentResult> {
  await requireAdminRole(academyId);

  const parsed = TournamentSchema.safeParse({
    name:        formData.get("name"),
    description: formData.get("description") || undefined,
    startDate:   formData.get("startDate") || undefined,
    endDate:     formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors.name?.[0] };
  }

  const { name, description, startDate, endDate } = parsed.data;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      name:        name.trim(),
      description: description?.trim() || null,
      startDate:   startDate ? new Date(startDate) : null,
      endDate:     endDate   ? new Date(endDate)   : null,
    },
  });

  revalidatePath(`/${academyId}/tournaments`);
  revalidatePath(`/${academyId}/tournaments/${tournamentId}`);
  return { success: true, tournamentId };
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export async function updateTournamentStatus(
  academyId: string,
  tournamentId: string,
  status: "ACTIVE" | "FINISHED"
): Promise<TournamentResult> {
  await requireAdminRole(academyId);

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status },
  });

  revalidatePath(`/${academyId}/tournaments`);
  revalidatePath(`/${academyId}/tournaments/${tournamentId}`);
  return { success: true };
}

// ─── Eliminar torneo ──────────────────────────────────────────────────────────

export async function deleteTournament(
  academyId: string,
  tournamentId: string
): Promise<TournamentResult> {
  await requireAdminRole(academyId);

  // Desvincular juegos antes de eliminar
  await prisma.game.updateMany({
    where: { tournamentId },
    data:  { tournamentId: null },
  });

  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath(`/${academyId}/tournaments`);
  return { success: true };
}
