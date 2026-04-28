"use server";

import { prisma } from "@/lib/prisma";
import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type AttendanceResult = { success: boolean; error?: string };

// ─── Confirmar asistencia (árbitro) ──────────────────────────────────────────

export async function confirmAttendance(
  academyId: string,
  gameId: string,
  latitude?: number,
  longitude?: number
): Promise<AttendanceResult> {
  await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return { success: false, error: "Usuario no encontrado" };

  // Verificar que el juego existe y tiene asignación para este árbitro
  const assignment = await prisma.gameAssignment.findFirst({
    where: { gameId, userId: user.id },
    include: {
      game: true,
      attendance: true,
    },
  });

  if (!assignment) {
    return { success: false, error: "No estás asignado a este juego" };
  }

  if (assignment.attendance) {
    return { success: false, error: "Ya confirmaste tu asistencia a este juego" };
  }

  // Solo permite confirmar en juegos SCHEDULED o CONFIRMED
  if (!["SCHEDULED", "CONFIRMED"].includes(assignment.game.status)) {
    return { success: false, error: "Este juego ya no permite confirmación de asistencia" };
  }

  await prisma.attendance.create({
    data: {
      gameAssignmentId: assignment.id,
      latitude:  latitude ?? null,
      longitude: longitude ?? null,
    },
  });

  revalidatePath(`/${academyId}/games/${gameId}`);
  revalidatePath(`/${academyId}/attendance`);
  return { success: true };
}

// ─── Cancelar confirmación (árbitro o admin) ─────────────────────────────────

export async function cancelAttendance(
  academyId: string,
  gameId: string,
  userId?: string // admin puede cancelar la de otro
): Promise<AttendanceResult> {
  const context = await requireAcademyAccess(academyId);
  const currentUser = await getDbUser();
  if (!currentUser) return { success: false, error: "Usuario no encontrado" };

  const targetUserId = context.role === "ADMIN" && userId ? userId : currentUser.id;

  const assignment = await prisma.gameAssignment.findFirst({
    where: { gameId, userId: targetUserId },
    include: { attendance: true },
  });

  if (!assignment || !assignment.attendance) {
    return { success: false, error: "No hay confirmación de asistencia para cancelar" };
  }

  await prisma.attendance.delete({
    where: { id: assignment.attendance.id },
  });

  revalidatePath(`/${academyId}/games/${gameId}`);
  revalidatePath(`/${academyId}/attendance`);
  return { success: true };
}

// ─── Obtener juegos pendientes de confirmar (árbitro) ────────────────────────

export async function getMyPendingAttendance(academyId: string) {
  await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return [];

  const assignments = await prisma.gameAssignment.findMany({
    where: {
      userId: user.id,
      game: {
        academyId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      attendance: null,
    },
    include: {
      game: {
        include: {
          sport: true,
          gameCategory: true,
        },
      },
    },
    orderBy: { game: { startTime: "asc" } },
  });

  return assignments;
}

// ─── Obtener estado de asistencia de un juego (admin) ────────────────────────

export async function getGameAttendance(academyId: string, gameId: string) {
  await requireAcademyAccess(academyId);

  const assignments = await prisma.gameAssignment.findMany({
    where: { gameId },
    include: {
      user: true,
      attendance: true,
    },
  });

  return assignments.map((a) => ({
    assignmentId: a.id,
    userId:       a.userId,
    userName:     a.user.name,
    userPhoto:    a.user.photoUrl,
    role:         a.role,
    confirmed:    !!a.attendance,
    confirmedAt:  a.attendance?.confirmedAt ?? null,
    latitude:     a.attendance?.latitude ?? null,
    longitude:    a.attendance?.longitude ?? null,
  }));
}
