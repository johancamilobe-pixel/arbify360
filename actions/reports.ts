"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FinancialSummary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalGames: number;
  finishedGames: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
};

export type GameFinancialRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  startTime: Date;
  status: string;
  categoryName: string;
  sportName: string;
  incomeAmount: number;
  totalExpenses: number;
  netProfit: number;
  approvedCount: number;
  totalAssignments: number;
};

export type RefereePendingPayment = {
  userId: string;
  userName: string;
  email: string;
  category: string | null;
  approvedGames: number;
  totalAmount: number;
};

// ─── Resumen financiero del período ──────────────────────────────────────────

export async function getFinancialSummary(
  academyId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialSummary> {
  await requireAdminRole(academyId);

  // Juegos del período (excluyendo cancelados)
  const games = await prisma.game.findMany({
    where: {
      academyId,
      startTime: { gte: startDate, lte: endDate },
      status: { not: "CANCELLED" },
    },
    include: {
      scoresheet: {
        include: {
          submissions: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
  });

  const finishedGames = games.filter((g) => g.status === "FINISHED");

  // Ingreso total: suma de incomeAmount de juegos finalizados
  const totalIncome = finishedGames.reduce(
    (sum, g) => sum + (g.incomeAmount ? Number(g.incomeAmount) : 0),
    0
  );

  // Egreso total: suma de paymentAmount de submissions aprobadas
  const totalExpenses = games.reduce((sum, g) => {
    const gameExpenses = g.scoresheet?.submissions.reduce(
      (s, sub) => s + (sub.paymentAmount ? Number(sub.paymentAmount) : 0),
      0
    ) ?? 0;
    return sum + gameExpenses;
  }, 0);

  // Pagos pendientes: submissions aprobadas que aún no se han marcado como pagadas
  // Por ahora (pre Fase B), TODAS las aprobadas son "pendientes de pago"
  // En Fase B agregaremos el modelo Payment para distinguir pagadas vs no pagadas
  const allApprovedSubmissions = await prisma.scoresheetSubmission.findMany({
    where: {
      status: "APPROVED",
      scoresheet: {
        game: {
          academyId,
          startTime: { gte: startDate, lte: endDate },
          status: { not: "CANCELLED" },
        },
      },
    },
  });

  const pendingPaymentAmount = allApprovedSubmissions.reduce(
    (sum, s) => sum + (s.paymentAmount ? Number(s.paymentAmount) : 0),
    0
  );

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    totalGames: games.length,
    finishedGames: finishedGames.length,
    pendingPayments: allApprovedSubmissions.length,
    pendingPaymentAmount,
  };
}

// ─── Tabla de juegos con desglose financiero ─────────────────────────────────

export async function getGamesFinancialBreakdown(
  academyId: string,
  startDate: Date,
  endDate: Date
): Promise<GameFinancialRow[]> {
  await requireAdminRole(academyId);

  const games = await prisma.game.findMany({
    where: {
      academyId,
      startTime: { gte: startDate, lte: endDate },
      status: { not: "CANCELLED" },
    },
    include: {
      gameCategory: true,
      sport: true,
      assignments: true,
      scoresheet: {
        include: {
          submissions: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  return games.map((game) => {
    const income = game.incomeAmount ? Number(game.incomeAmount) : 0;
    const expenses = game.scoresheet?.submissions.reduce(
      (sum, sub) => sum + (sub.paymentAmount ? Number(sub.paymentAmount) : 0),
      0
    ) ?? 0;

    return {
      id: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      venue: game.venue,
      startTime: game.startTime,
      status: game.status,
      categoryName: game.gameCategory.name,
      sportName: game.sport.name,
      incomeAmount: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      approvedCount: game.scoresheet?.submissions.length ?? 0,
      totalAssignments: game.assignments.length,
    };
  });
}

// ─── Resumen de pagos pendientes por árbitro ─────────────────────────────────

export async function getPendingPaymentsByReferee(
  academyId: string,
  startDate: Date,
  endDate: Date
): Promise<RefereePendingPayment[]> {
  await requireAdminRole(academyId);

  const submissions = await prisma.scoresheetSubmission.findMany({
    where: {
      status: "APPROVED",
      scoresheet: {
        game: {
          academyId,
          startTime: { gte: startDate, lte: endDate },
          status: { not: "CANCELLED" },
        },
      },
    },
    include: {
      user: {
        include: {
          memberships: {
            where: { academyId },
            include: { refereeCategory: true },
          },
        },
      },
    },
  });

  // Agrupar por árbitro
  const grouped = new Map<string, RefereePendingPayment>();

  for (const sub of submissions) {
    const existing = grouped.get(sub.userId);
    const amount = sub.paymentAmount ? Number(sub.paymentAmount) : 0;
    const membership = sub.user.memberships[0];
    const category = membership?.refereeCategory?.name ?? null;

    if (existing) {
      existing.approvedGames += 1;
      existing.totalAmount += amount;
    } else {
      grouped.set(sub.userId, {
        userId: sub.userId,
        userName: sub.user.name,
        email: sub.user.email,
        category,
        approvedGames: 1,
        totalAmount: amount,
      });
    }
  }

  // Ordenar por monto total descendente
  return Array.from(grouped.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
}
