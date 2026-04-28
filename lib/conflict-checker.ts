import { prisma } from "./prisma";

// ─────────────────────────────────────────────────────────────────────────────
// DETECCIÓN DE CONFLICTOS DE HORARIO ENTRE ACADEMIAS
//
// Regla: Un árbitro que pertenece a múltiples academias del MISMO deporte
// no puede estar asignado en dos juegos simultáneos.
// Los admins de academias del mismo deporte pueden ver esta ocupación.
// ─────────────────────────────────────────────────────────────────────────────

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  userId: string;
  userName: string;
  conflictingGameId: string;
  conflictingAcademyName: string;
  conflictingVenue: string;
  conflictingHomeTeam: string;
  conflictingAwayTeam: string;
  startTime: Date;
  endTime: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificar si UN árbitro tiene conflicto para un juego nuevo
// ─────────────────────────────────────────────────────────────────────────────

export async function checkRefereeConflict(
  userId: string,
  sportId: string,
  startTime: Date,
  endTime: Date,
  excludeGameId?: string // Para edición — ignorar el juego actual
): Promise<ConflictDetail | null> {
  // Buscar juegos del mismo deporte donde este árbitro ya está asignado
  // y que se solapan con el horario propuesto
  const conflictingAssignment = await prisma.gameAssignment.findFirst({
    where: {
      userId,
      game: {
        sportId,
        id: excludeGameId ? { not: excludeGameId } : undefined,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        // Solapamiento de horarios:
        // El juego existente empieza antes de que termine el nuevo
        // Y el juego existente termina después de que empiece el nuevo
        AND: [
          { startTime: { lt: endTime } },
          { endTime:   { gt: startTime } },
        ],
      },
    },
    include: {
      user: true,
      game: {
        include: { academy: true },
      },
    },
  });

  if (!conflictingAssignment) return null;

  return {
    userId: conflictingAssignment.userId,
    userName: conflictingAssignment.user.name,
    conflictingGameId: conflictingAssignment.gameId,
    conflictingAcademyName: conflictingAssignment.game.academy.name,
    conflictingVenue: conflictingAssignment.game.venue,
    conflictingHomeTeam: conflictingAssignment.game.homeTeam,
    conflictingAwayTeam: conflictingAssignment.game.awayTeam,
    startTime: conflictingAssignment.game.startTime,
    endTime: conflictingAssignment.game.endTime,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificar conflictos para TODOS los árbitros de un juego a la vez
// Usado al crear o editar un juego con múltiples asignaciones
// ─────────────────────────────────────────────────────────────────────────────

export async function checkGameConflicts(
  userIds: string[],
  sportId: string,
  startTime: Date,
  endTime: Date,
  excludeGameId?: string
): Promise<ConflictResult> {
  const conflicts: ConflictDetail[] = [];

  for (const userId of userIds) {
    const conflict = await checkRefereeConflict(
      userId,
      sportId,
      startTime,
      endTime,
      excludeGameId
    );
    if (conflict) conflicts.push(conflict);
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Árbitros disponibles para un horario y deporte específico
// Filtra los árbitros de la academia que NO tienen conflicto
// Usado en el selector de árbitros al crear un juego
// ─────────────────────────────────────────────────────────────────────────────

export async function getAvailableReferees(
  academyId: string,
  sportId: string,
  startTime: Date,
  endTime: Date,
  excludeGameId?: string
) {
  // Traer todos los árbitros activos de la academia
  const memberships = await prisma.academyMembership.findMany({
    where: {
      academyId,
      role: "REFEREE",
      isActive: true,
    },
    include: {
      user: true,
      refereeCategory: true,
    },
  });

  // Para cada árbitro, verificar si tiene conflicto
  const results = await Promise.all(
    memberships.map(async (m) => {
      const conflict = await checkRefereeConflict(
        m.userId,
        sportId,
        startTime,
        endTime,
        excludeGameId
      );
      return {
        userId: m.userId,
        name: m.user.name,
        photoUrl: m.user.photoUrl,
        licenseNumber: m.user.licenseNumber,
        category: m.refereeCategory?.name ?? null,
        ratePerGame: m.ratePerGame,
        isAvailable: !conflict,
        conflict: conflict ?? null,
      };
    })
  );

  return results;
}
