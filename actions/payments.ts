"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole, getDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subDays,
} from "date-fns";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PendingSubmission = {
  submissionId: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  startTime: Date;
  gameRole: string;
  paymentAmount: number;
  categoryName: string;
};

export type RefereePendingGroup = {
  userId: string;
  userName: string;
  email: string;
  category: string | null;
  submissions: PendingSubmission[];
  totalAmount: number;
};

export type PaymentRecord = {
  id: string;
  refereeId: string;
  refereeName: string;
  periodType: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  method: string;
  status: string;
  receiptNumber: string | null;
  paidByName: string;
  paidAt: Date;
  itemCount: number;
};

export type PaymentDetail = PaymentRecord & {
  items: {
    id: string;
    amount: number;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    startTime: Date;
    gameRole: string;
  }[];
  notes: string | null;
  refereeEmail: string;
  refereeCategory: string | null;
  academyName: string;
};

export type IncomeRecord = {
  id: string;
  source: string;
  sourceName: string;
  description: string | null;
  amount: number;
  method: string;
  date: Date;
  notes: string | null;
};

// ─── Helpers de período ──────────────────────────────────────────────────────

function getPeriodRange(
  periodType: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  referenceDate: Date
): { start: Date; end: Date } {
  switch (periodType) {
    case "DAILY":
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case "WEEKLY":
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      };
    case "BIWEEKLY": {
      const day = referenceDate.getDate();
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      if (day <= 15) {
        return {
          start: new Date(year, month, 1),
          end: new Date(year, month, 15, 23, 59, 59),
        };
      } else {
        return {
          start: new Date(year, month, 16),
          end: endOfMonth(referenceDate),
        };
      }
    }
    case "MONTHLY":
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
  }
}

// ─── Obtener submissions pendientes de pago agrupadas por árbitro ──────────

export async function getPendingPayments(
  academyId: string,
  periodType: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  referenceDate?: Date
): Promise<RefereePendingGroup[]> {
  await requireAdminRole(academyId);

  const ref = referenceDate ?? new Date();
  const { start, end } = getPeriodRange(periodType, ref);

  // Submissions aprobadas SIN PaymentItem asociado, dentro del período
  const submissions = await prisma.scoresheetSubmission.findMany({
    where: {
      status: "APPROVED",
      paymentItem: null, // No tiene pago asociado
      scoresheet: {
        game: {
          academyId,
          startTime: { gte: start, lte: end },
          status: "FINISHED",
        },
      },
    },
    include: {
      scoresheet: {
        include: {
          game: {
            include: { gameCategory: true },
          },
        },
      },
      user: {
        include: {
          memberships: {
            where: { academyId },
            include: { refereeCategory: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por árbitro
  const grouped = new Map<string, RefereePendingGroup>();

  for (const sub of submissions) {
    const amount = sub.paymentAmount ? Number(sub.paymentAmount) : 0;
    const game = sub.scoresheet.game;
    const membership = sub.user.memberships[0];

    const item: PendingSubmission = {
      submissionId: sub.id,
      gameId: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      venue: game.venue,
      startTime: game.startTime,
      gameRole: sub.role,
      paymentAmount: amount,
      categoryName: game.gameCategory.name,
    };

    const existing = grouped.get(sub.userId);
    if (existing) {
      existing.submissions.push(item);
      existing.totalAmount += amount;
    } else {
      grouped.set(sub.userId, {
        userId: sub.userId,
        userName: sub.user.name,
        email: sub.user.email,
        category: membership?.refereeCategory?.name ?? null,
        submissions: [item],
        totalAmount: amount,
      });
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
}

// ─── Registrar pago a un árbitro ──────────────────────────────────────────────

export async function createPayment(
  academyId: string,
  data: {
    refereeId: string;
    submissionIds: string[];
    method: "CASH" | "BANK_TRANSFER" | "NEQUI" | "DAVIPLATA";
    periodType: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    periodStart: string; // ISO date
    periodEnd: string;   // ISO date
    notes?: string;
  }
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const { user } = await requireAdminRole(academyId);

  try {
    // Verificar que las submissions existen, están aprobadas y no pagadas
    const submissions = await prisma.scoresheetSubmission.findMany({
      where: {
        id: { in: data.submissionIds },
        status: "APPROVED",
        paymentItem: null,
        scoresheet: {
          game: { academyId, status: "FINISHED" },
        },
      },
    });

    if (submissions.length !== data.submissionIds.length) {
      return {
        success: false,
        error: "Algunas planillas ya fueron pagadas o no son válidas.",
      };
    }

    // Calcular total
    const totalAmount = submissions.reduce(
      (sum, s) => sum + (s.paymentAmount ? Number(s.paymentAmount) : 0),
      0
    );

    // Generar número de recibo
    const paymentCount = await prisma.payment.count({
      where: { academyId },
    });
    const receiptNumber = `REC-${String(paymentCount + 1).padStart(5, "0")}`;

    // Crear pago con items en una transacción
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          academyId,
          refereeId: data.refereeId,
          periodType: data.periodType,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          totalAmount,
          method: data.method,
          notes: data.notes,
          receiptNumber,
          paidById: user.id,
          items: {
            create: submissions.map((sub) => ({
              scoresheetSubmissionId: sub.id,
              amount: sub.paymentAmount ?? 0,
            })),
          },
        },
      });
      return p;
    });

    revalidatePath(`/${academyId}/payments`);
    revalidatePath(`/${academyId}/reports`);

    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { success: false, error: "Error al registrar el pago." };
  }
}

// ─── Anular pago ──────────────────────────────────────────────────────────────

export async function voidPayment(
  academyId: string,
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdminRole(academyId);

  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, academyId, status: "COMPLETED" },
    });

    if (!payment) {
      return { success: false, error: "Pago no encontrado o ya anulado." };
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar PaymentItems (libera las submissions para re-pago)
      await tx.paymentItem.deleteMany({ where: { paymentId } });
      // Marcar como anulado
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "VOIDED" },
      });
    });

    revalidatePath(`/${academyId}/payments`);
    revalidatePath(`/${academyId}/reports`);

    return { success: true };
  } catch (error) {
    console.error("Error voiding payment:", error);
    return { success: false, error: "Error al anular el pago." };
  }
}

// ─── Listar pagos realizados ──────────────────────────────────────────────────

export async function getPayments(
  academyId: string,
  startDate: Date,
  endDate: Date
): Promise<PaymentRecord[]> {
  await requireAdminRole(academyId);

  const payments = await prisma.payment.findMany({
    where: {
      academyId,
      paidAt: { gte: startDate, lte: endDate },
    },
    include: {
      referee: true,
      paidBy: true,
      _count: { select: { items: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    refereeId: p.refereeId,
    refereeName: p.referee.name,
    periodType: p.periodType,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    totalAmount: Number(p.totalAmount),
    method: p.method,
    status: p.status,
    receiptNumber: p.receiptNumber,
    paidByName: p.paidBy.name,
    paidAt: p.paidAt,
    itemCount: p._count.items,
  }));
}

// ─── Detalle de un pago (para recibo) ─────────────────────────────────────────

export async function getPaymentDetail(
  academyId: string,
  paymentId: string
): Promise<PaymentDetail | null> {
  await requireAdminRole(academyId);

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, academyId },
    include: {
      referee: {
        include: {
          memberships: {
            where: { academyId },
            include: { refereeCategory: true },
          },
        },
      },
      paidBy: true,
      academy: true,
      items: {
        include: {
          scoresheetSubmission: {
            include: {
              scoresheet: {
                include: { game: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) return null;

  const membership = payment.referee.memberships[0];

  return {
    id: payment.id,
    refereeId: payment.refereeId,
    refereeName: payment.referee.name,
    refereeEmail: payment.referee.email,
    refereeCategory: membership?.refereeCategory?.name ?? null,
    academyName: payment.academy.name,
    periodType: payment.periodType,
    periodStart: payment.periodStart,
    periodEnd: payment.periodEnd,
    totalAmount: Number(payment.totalAmount),
    method: payment.method,
    status: payment.status,
    receiptNumber: payment.receiptNumber,
    paidByName: payment.paidBy.name,
    paidAt: payment.paidAt,
    notes: payment.notes,
    itemCount: payment.items.length,
    items: payment.items.map((item) => {
      const game = item.scoresheetSubmission.scoresheet.game;
      return {
        id: item.id,
        amount: Number(item.amount),
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        venue: game.venue,
        startTime: game.startTime,
        gameRole: item.scoresheetSubmission.role,
      };
    }),
  };
}

// ─── INGRESOS ─────────────────────────────────────────────────────────────────

export async function createIncome(
  academyId: string,
  data: {
    source: "TEAM" | "CLUB" | "LEAGUE";
    sourceName: string;
    description?: string;
    amount: number;
    method: "CASH" | "BANK_TRANSFER" | "NEQUI" | "DAVIPLATA";
    date: string; // ISO date
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAdminRole(academyId);

  try {
    await prisma.income.create({
      data: {
        academyId,
        source: data.source,
        sourceName: data.sourceName,
        description: data.description,
        amount: data.amount,
        method: data.method,
        date: new Date(data.date),
        notes: data.notes,
      },
    });

    revalidatePath(`/${academyId}/payments`);
    revalidatePath(`/${academyId}/reports`);

    return { success: true };
  } catch (error) {
    console.error("Error creating income:", error);
    return { success: false, error: "Error al registrar el ingreso." };
  }
}

export async function getIncomes(
  academyId: string,
  startDate: Date,
  endDate: Date
): Promise<IncomeRecord[]> {
  await requireAdminRole(academyId);

  const incomes = await prisma.income.findMany({
    where: {
      academyId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "desc" },
  });

  return incomes.map((i) => ({
    id: i.id,
    source: i.source,
    sourceName: i.sourceName,
    description: i.description,
    amount: Number(i.amount),
    method: i.method,
    date: i.date,
    notes: i.notes,
  }));
}

export async function deleteIncome(
  academyId: string,
  incomeId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdminRole(academyId);

  try {
    await prisma.income.delete({
      where: { id: incomeId },
    });

    revalidatePath(`/${academyId}/payments`);
    revalidatePath(`/${academyId}/reports`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting income:", error);
    return { success: false, error: "Error al eliminar el ingreso." };
  }
}
