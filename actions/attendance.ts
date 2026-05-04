"use server";

import { prisma } from "@/lib/prisma";
import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type AttendanceResult = { success: boolean; error?: string };

// ─── Responder disponibilidad (árbitro acepta o rechaza) ──────────────────────

export async function respondAttendance(
  academyId: string,
  gameId: string,
  response: "ACCEPTED" | "REJECTED",
  comment?: string
): Promise<AttendanceResult> {
  await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return { success: false, error: "Usuario no encontrado" };

  // Comentario obligatorio si rechaza
  if (response === "REJECTED" && (!comment || comment.trim().length === 0)) {
    return { success: false, error: "Debes indicar el motivo por el que no puedes asistir" };
  }

  const assignment = await prisma.gameAssignment.findFirst({
    where: { gameId, userId: user.id },
    include: { game: true, attendance: true },
  });

  if (!assignment) {
    return { success: false, error: "No estás asignado a este juego" };
  }

  if (!["SCHEDULED", "CONFIRMED"].includes(assignment.game.status)) {
    return { success: false, error: "Este juego ya no permite confirmar disponibilidad" };
  }

  if (assignment.attendance) {
    // Actualizar respuesta existente
    await prisma.attendance.update({
      where: { id: assignment.attendance.id },
      data: {
        response,
        comment: comment?.trim() || null,
        // Si cambia a REJECTED, limpiar check-in
        ...(response === "REJECTED" ? {
          checkedInAt: null,
          latitude: null,
          longitude: null,
        } : {}),
      },
    });
  } else {
    // Crear nueva respuesta
    await prisma.attendance.create({
      data: {
        gameAssignmentId: assignment.id,
        response,
        comment: comment?.trim() || null,
      },
    });
  }

  revalidatePath(`/${academyId}/games/${gameId}`);
  revalidatePath(`/${academyId}/attendance`);
  return { success: true };
}

// ─── Check-in GPS (árbitro registra llegada al juego) ────────────────────────

export async function checkInAttendance(
  academyId: string,
  gameId: string,
  latitude?: number,
  longitude?: number
): Promise<AttendanceResult> {
  await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return { success: false, error: "Usuario no encontrado" };

  const assignment = await prisma.gameAssignment.findFirst({
    where: { gameId, userId: user.id },
    include: { game: true, attendance: true },
  });

  if (!assignment) {
    return { success: false, error: "No estás asignado a este juego" };
  }

  if (!assignment.attendance || assignment.attendance.response !== "ACCEPTED") {
    return { success: false, error: "Debes aceptar el juego antes de registrar tu llegada" };
  }

  await prisma.attendance.update({
    where: { id: assignment.attendance.id },
    data: {
      checkedInAt: new Date(),
      latitude:    latitude ?? null,
      longitude:   longitude ?? null,
    },
  });

  revalidatePath(`/${academyId}/games/${gameId}`);
  revalidatePath(`/${academyId}/attendance`);
  return { success: true };
}

// ─── Confirmar asistencia (legacy — mantener compatibilidad) ──────────────────

export async function confirmAttendance(
  academyId: string,
  gameId: string,
  latitude?: number,
  longitude?: number
): Promise<AttendanceResult> {
  return respondAttendance(academyId, gameId, "ACCEPTED");
}

// ─── Cancelar confirmación (árbitro o admin) ─────────────────────────────────

export async function cancelAttendance(
  academyId: string,
  gameId: string,
  userId?: string
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
    return { success: false, error: "No hay respuesta de asistencia para cancelar" };
  }

  await prisma.attendance.delete({
    where: { id: assignment.attendance.id },
  });

  revalidatePath(`/${academyId}/games/${gameId}`);
  revalidatePath(`/${academyId}/attendance`);
  return { success: true };
}

// ─── Obtener juegos pendientes de responder (árbitro) ────────────────────────

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
      game: { include: { sport: true, gameCategory: true } },
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
    include: { user: true, attendance: true },
  });

  return assignments.map((a) => ({
    assignmentId: a.id,
    userId:       a.userId,
    userName:     a.user.name,
    userPhoto:    a.user.photoUrl,
    role:         a.role,
    response:     a.attendance?.response ?? null,
    comment:      a.attendance?.comment ?? null,
    confirmedAt:  a.attendance?.confirmedAt ?? null,
    checkedInAt:  a.attendance?.checkedInAt ?? null,
    latitude:     a.attendance?.latitude ?? null,
    longitude:    a.attendance?.longitude ?? null,
  }));
}
