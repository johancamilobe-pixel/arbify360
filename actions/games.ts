"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole, requireAcademyAccess } from "@/lib/auth";
import { checkGameConflicts } from "@/lib/conflict-checker";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas de validación ────────────────────────────────────────────────────

const GameSchema = z.object({
  homeTeam:       z.string().min(1, "Equipo local requerido"),
  awayTeam:       z.string().min(1, "Equipo visitante requerido"),
  venue:          z.string().min(1, "Lugar requerido"),
  sportId:        z.string().min(1, "Deporte requerido"),
  gameCategoryId: z.string().min(1, "Categoría requerida"),
  startTime:      z.string().min(1, "Hora de inicio requerida"),
  endTime:        z.string().min(1, "Hora de fin requerida"),
  mainRefereeId:       z.string().optional(),
  secondaryRefereeId:  z.string().optional(),
  tableAssistantId:    z.string().optional(),
});

export type GameFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  gameId?: string;
  conflicts?: {
    userName: string;
    conflictingAcademyName: string;
    conflictingVenue: string;
    startTime: Date;
    endTime: Date;
  }[];
};

// ─── Crear juego ──────────────────────────────────────────────────────────────

export async function createGame(
  academyId: string,
  formData: FormData
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  const raw = {
    homeTeam:            formData.get("homeTeam"),
    awayTeam:            formData.get("awayTeam"),
    venue:               formData.get("venue"),
    sportId:             formData.get("sportId"),
    gameCategoryId:      formData.get("gameCategoryId"),
    startTime:           formData.get("startTime"),
    endTime:             formData.get("endTime"),
    mainRefereeId:       formData.get("mainRefereeId") || undefined,
    secondaryRefereeId:  formData.get("secondaryRefereeId") || undefined,
    tableAssistantId:    formData.get("tableAssistantId") || undefined,
  };

  const parsed = GameSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const startTime = new Date(data.startTime);
  const endTime   = new Date(data.endTime);

  if (endTime <= startTime) {
    return { success: false, error: "La hora de fin debe ser después de la hora de inicio" };
  }

  const category = await prisma.gameCategory.findUnique({
    where: { id: data.gameCategoryId },
  });

  const assignedReferees = [
    data.mainRefereeId,
    data.secondaryRefereeId,
    data.tableAssistantId,
  ].filter(Boolean) as string[];

  if (assignedReferees.length > 0) {
    const { hasConflict, conflicts } = await checkGameConflicts(
      assignedReferees,
      data.sportId,
      startTime,
      endTime
    );

    if (hasConflict) {
      return {
        success: false,
        error: "Conflicto de horario detectado",
        conflicts: conflicts.map((c) => ({
          userName: c.userName,
          conflictingAcademyName: c.conflictingAcademyName,
          conflictingVenue: c.conflictingVenue,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      };
    }
  }

  const game = await prisma.game.create({
    data: {
      academyId,
      sportId:        data.sportId,
      gameCategoryId: data.gameCategoryId,
      homeTeam:       data.homeTeam,
      awayTeam:       data.awayTeam,
      venue:          data.venue,
      startTime,
      endTime,
      status:         "SCHEDULED",
      incomeAmount:   category?.incomePerGame ?? null,
    },
  });

  const assignments = [
    { userId: data.mainRefereeId,      role: "MAIN_REFEREE" },
    { userId: data.secondaryRefereeId, role: "SECONDARY_REFEREE" },
    { userId: data.tableAssistantId,   role: "TABLE_ASSISTANT" },
  ].filter((a) => a.userId);

  if (assignments.length > 0) {
    await prisma.gameAssignment.createMany({
      data: assignments.map((a) => ({
        gameId: game.id,
        userId: a.userId!,
        role:   a.role as any,
      })),
    });
  }

  revalidatePath(`/${academyId}/games`);
  return { success: true, gameId: game.id };
}

// ─── Editar juego ─────────────────────────────────────────────────────────────

export async function updateGame(
  academyId: string,
  gameId: string,
  formData: FormData
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  const raw = {
    homeTeam:            formData.get("homeTeam"),
    awayTeam:            formData.get("awayTeam"),
    venue:               formData.get("venue"),
    sportId:             formData.get("sportId"),
    gameCategoryId:      formData.get("gameCategoryId"),
    startTime:           formData.get("startTime"),
    endTime:             formData.get("endTime"),
    mainRefereeId:       formData.get("mainRefereeId") || undefined,
    secondaryRefereeId:  formData.get("secondaryRefereeId") || undefined,
    tableAssistantId:    formData.get("tableAssistantId") || undefined,
  };

  const parsed = GameSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const startTime = new Date(data.startTime);
  const endTime   = new Date(data.endTime);

  if (endTime <= startTime) {
    return { success: false, error: "La hora de fin debe ser después de la hora de inicio" };
  }

  // Verificar que el juego existe y pertenece a la academia
  const existing = await prisma.game.findUnique({
    where: { id: gameId, academyId },
  });
  if (!existing) return { success: false, error: "Juego no encontrado" };

  // Verificar conflictos para los nuevos árbitros (excluyendo el juego actual)
  const assignedReferees = [
    data.mainRefereeId,
    data.secondaryRefereeId,
    data.tableAssistantId,
  ].filter(Boolean) as string[];

  if (assignedReferees.length > 0) {
    const { hasConflict, conflicts } = await checkGameConflicts(
      assignedReferees,
      data.sportId,
      startTime,
      endTime,
      gameId // excluir el juego actual de la verificación
    );

    if (hasConflict) {
      return {
        success: false,
        error: "Conflicto de horario detectado",
        conflicts: conflicts.map((c) => ({
          userName: c.userName,
          conflictingAcademyName: c.conflictingAcademyName,
          conflictingVenue: c.conflictingVenue,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      };
    }
  }

  // Si cambió la categoría, actualizar el incomeAmount
  let incomeAmount = existing.incomeAmount;
  if (data.gameCategoryId !== existing.gameCategoryId) {
    const category = await prisma.gameCategory.findUnique({
      where: { id: data.gameCategoryId },
    });
    incomeAmount = category?.incomePerGame ?? null;
  }

  // Actualizar el juego
  await prisma.game.update({
    where: { id: gameId },
    data: {
      homeTeam:       data.homeTeam,
      awayTeam:       data.awayTeam,
      venue:          data.venue,
      sportId:        data.sportId,
      gameCategoryId: data.gameCategoryId,
      startTime,
      endTime,
      incomeAmount,
    },
  });

  // Reemplazar asignaciones de árbitros completamente
  // Solo eliminar asignaciones que NO tengan planillas aprobadas
  const existingAssignments = await prisma.gameAssignment.findMany({
    where: { gameId },
    include: {
      game: {
        include: {
          scoresheet: {
            include: {
              submissions: { where: { status: "APPROVED" } },
            },
          },
        },
      },
    },
  });

  // IDs de árbitros con planillas aprobadas — no tocarlos
  const approvedUserIds = new Set<string>();
  for (const a of existingAssignments) {
    const hasApproved = a.game.scoresheet?.submissions.some(
      (s) => s.userId === a.userId && s.status === "APPROVED"
    );
    if (hasApproved) approvedUserIds.add(a.userId);
  }

  // Eliminar asignaciones sin planilla aprobada
  await prisma.gameAssignment.deleteMany({
    where: {
      gameId,
      userId: { notIn: Array.from(approvedUserIds) },
    },
  });

  // Crear nuevas asignaciones (saltando árbitros con planilla aprobada)
  const newAssignments = [
    { userId: data.mainRefereeId,      role: "MAIN_REFEREE" as const },
    { userId: data.secondaryRefereeId, role: "SECONDARY_REFEREE" as const },
    { userId: data.tableAssistantId,   role: "TABLE_ASSISTANT" as const },
  ].filter((a) => a.userId && !approvedUserIds.has(a.userId!));

  if (newAssignments.length > 0) {
    await prisma.gameAssignment.createMany({
      data: newAssignments.map((a) => ({
        gameId,
        userId: a.userId!,
        role:   a.role,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(`/${academyId}/games`);
  revalidatePath(`/${academyId}/games/${gameId}`);
  return { success: true, gameId };
}

// ─── Actualizar estado del juego ──────────────────────────────────────────────

export async function updateGameStatus(
  academyId: string,
  gameId: string,
  status: "SCHEDULED" | "CONFIRMED" | "FINISHED" | "CANCELLED"
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  await prisma.game.update({
    where: { id: gameId, academyId },
    data: { status },
  });

  revalidatePath(`/${academyId}/games`);
  revalidatePath(`/${academyId}/games/${gameId}`);
  return { success: true };
}

// ─── Eliminar juego ───────────────────────────────────────────────────────────

export async function deleteGame(
  academyId: string,
  gameId: string
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  await prisma.game.delete({
    where: { id: gameId, academyId },
  });

  revalidatePath(`/${academyId}/games`);
  return { success: true };
}

// ─── Eliminar planilla completa (todas las submissions de un juego) ───────────

export async function deleteScoresheet(
  academyId: string,
  gameId: string
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  const scoresheet = await prisma.scoresheet.findUnique({
    where: { gameId },
    include: { game: true },
  });

  if (!scoresheet || scoresheet.game.academyId !== academyId) {
    return { success: false, error: "Planilla no encontrada" };
  }

  await prisma.scoresheet.delete({ where: { gameId } });

  revalidatePath(`/${academyId}/scoresheets/${gameId}`);
  revalidatePath(`/${academyId}/scoresheets`);
  revalidatePath(`/${academyId}/games/${gameId}`);
  return { success: true };
}

// ─── Eliminar submission individual de un árbitro ─────────────────────────────

export async function deleteSubmission(
  academyId: string,
  submissionId: string
): Promise<GameFormState> {
  await requireAdminRole(academyId);

  const submission = await prisma.scoresheetSubmission.findUnique({
    where: { id: submissionId },
    include: { scoresheet: { include: { game: true } } },
  });

  if (!submission || submission.scoresheet.game.academyId !== academyId) {
    return { success: false, error: "Submission no encontrada" };
  }

  const gameId = submission.scoresheet.game.id;

  await prisma.scoresheetSubmission.delete({ where: { id: submissionId } });

  revalidatePath(`/${academyId}/scoresheets/${gameId}`);
  revalidatePath(`/${academyId}/scoresheets`);
  revalidatePath(`/${academyId}/games/${gameId}`);
  return { success: true };
}
