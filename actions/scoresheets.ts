"use server";

import { prisma } from "@/lib/prisma";
import { requireAcademyAccess, requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ScoresheetFormState = {
  success: boolean;
  error?: string;
};

// ─── Subir foto de planilla (árbitro) ─────────────────────────────────────────

export async function submitScoresheet(
  academyId: string,
  gameId: string,
  userId: string,
  role: string,
  photoUrl: string,
  refereeComment?: string
): Promise<ScoresheetFormState> {
  await requireAcademyAccess(academyId);

  // Verificar que el juego existe y está finalizado o confirmado
  const game = await prisma.game.findUnique({
    where: { id: gameId, academyId },
    include: { scoresheet: true },
  });

  if (!game) return { success: false, error: "Juego no encontrado" };

  if (!["CONFIRMED", "FINISHED"].includes(game.status)) {
    return { success: false, error: "Solo puedes subir planilla cuando el juego está confirmado o finalizado" };
  }

  // Crear scoresheet si no existe
  let scoresheet = game.scoresheet;
  if (!scoresheet) {
    scoresheet = await prisma.scoresheet.create({
      data: { gameId },
    });
  }

  // Verificar si ya subió
  const existing = await prisma.scoresheetSubmission.findUnique({
    where: { scoresheetId_userId: { scoresheetId: scoresheet.id, userId } },
  });

  if (existing && existing.status === "APPROVED") {
    return { success: false, error: "Tu planilla ya fue aprobada" };
  }

  // Si existe pero fue rechazada, actualizar
  if (existing) {
    await prisma.scoresheetSubmission.update({
      where: { id: existing.id },
      data: {
        photoUrl,
        refereeComment: refereeComment ?? null,
        status: "PENDING",
        adminComment: null,
        approvedById: null,
        approvedAt: null,
      },
    });
  } else {
    // Crear nueva submission
    await prisma.scoresheetSubmission.create({
      data: {
        scoresheetId:   scoresheet.id,
        userId,
        role:           role as any,
        photoUrl,
        refereeComment: refereeComment ?? null,
        status:         "PENDING",
      },
    });
  }

  revalidatePath(`/${academyId}/scoresheets/${gameId}`);
  revalidatePath(`/${academyId}/games/${gameId}`);
  return { success: true };
}

// ─── Aprobar planilla (admin) ────────────────────────────────────────────────

export async function approveSubmission(
  academyId: string,
  submissionId: string,
  adminUserId: string,
  adminComment?: string
): Promise<ScoresheetFormState> {
  await requireAdminRole(academyId);

  const submission = await prisma.scoresheetSubmission.findUnique({
    where: { id: submissionId },
    include: {
      scoresheet: {
        include: { game: true },
      },
      user: true,
    },
  });

  if (!submission) return { success: false, error: "Subida no encontrada" };

  // Obtener la tarifa desde la categoría del árbitro
  const membership = await prisma.academyMembership.findUnique({
    where: {
      userId_academyId: {
        userId: submission.userId,
        academyId,
      },
    },
    include: { refereeCategory: true },
  });

  const paymentAmount = membership?.refereeCategory?.ratePerGame ?? null;

  await prisma.scoresheetSubmission.update({
    where: { id: submissionId },
    data: {
      status:        "APPROVED",
      adminComment:  adminComment ?? null,
      paymentAmount,
      approvedById:  adminUserId,
      approvedAt:    new Date(),
    },
  });

  revalidatePath(`/${academyId}/scoresheets/${submission.scoresheet.gameId}`);
  revalidatePath(`/${academyId}/scoresheets`);
  revalidatePath(`/${academyId}/games/${submission.scoresheet.gameId}`);
  return { success: true };
}

// ─── Rechazar planilla (admin) ───────────────────────────────────────────────

export async function rejectSubmission(
  academyId: string,
  submissionId: string,
  adminUserId: string,
  adminComment: string
): Promise<ScoresheetFormState> {
  await requireAdminRole(academyId);

  if (!adminComment.trim()) {
    return { success: false, error: "Debes indicar el motivo del rechazo" };
  }

  const submission = await prisma.scoresheetSubmission.findUnique({
    where: { id: submissionId },
    include: { scoresheet: true },
  });

  if (!submission) return { success: false, error: "Subida no encontrada" };

  await prisma.scoresheetSubmission.update({
    where: { id: submissionId },
    data: {
      status:       "REJECTED",
      adminComment,
      approvedById: adminUserId,
      approvedAt:   new Date(),
      paymentAmount: null,
    },
  });

  revalidatePath(`/${academyId}/scoresheets/${submission.scoresheet.gameId}`);
  revalidatePath(`/${academyId}/scoresheets`);
  return { success: true };
}