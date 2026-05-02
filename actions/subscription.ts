"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SubscriptionState = {
  status: "TRIAL" | "ACTIVE" | "EXPIRED";
  daysLeft: number;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  lastPaymentAt: Date | null;
  canPay: boolean; // false si ya pagó en los últimos 30 días
};

// ─── Obtener estado de suscripción de una academia ────────────────────────────

export async function getSubscription(academyId: string): Promise<SubscriptionState | null> {
  const sub = await prisma.subscription.findUnique({
    where: { academyId },
  });

  if (!sub) return null;

  const now = new Date();

  // Calcular status real (puede diferir del guardado si venció)
  let status: "TRIAL" | "ACTIVE" | "EXPIRED" = sub.status;
  let daysLeft = 0;

  if (sub.status === "TRIAL") {
    if (now > sub.trialEndsAt) {
      status = "EXPIRED";
      daysLeft = 0;
      // Actualizar en DB
      await prisma.subscription.update({
        where: { academyId },
        data: { status: "EXPIRED" },
      });
    } else {
      daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else if (sub.status === "ACTIVE") {
    if (sub.subscriptionEndsAt && now > sub.subscriptionEndsAt) {
      status = "EXPIRED";
      daysLeft = 0;
      await prisma.subscription.update({
        where: { academyId },
        data: { status: "EXPIRED" },
      });
    } else if (sub.subscriptionEndsAt) {
      daysLeft = Math.ceil((sub.subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // canPay: solo si no hay pago en los últimos 30 días
  const canPay =
    status === "EXPIRED" ||
    status === "TRIAL" ||
    !sub.lastPaymentAt ||
    now.getTime() - sub.lastPaymentAt.getTime() > 30 * 24 * 60 * 60 * 1000;

  return {
    status,
    daysLeft,
    trialEndsAt:        sub.trialEndsAt,
    subscriptionEndsAt: sub.subscriptionEndsAt,
    lastPaymentAt:      sub.lastPaymentAt,
    canPay,
  };
}

// ─── Verificar si una academia tiene acceso (para middleware) ─────────────────

export async function checkAcademyAccess(academyId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { academyId },
    select: { status: true, trialEndsAt: true, subscriptionEndsAt: true },
  });

  if (!sub) return false;

  const now = new Date();

  if (sub.status === "TRIAL") return now <= sub.trialEndsAt;
  if (sub.status === "ACTIVE") {
    return sub.subscriptionEndsAt ? now <= sub.subscriptionEndsAt : false;
  }
  return false;
}

// ─── Activar suscripción tras pago WOMPI (llamado desde webhook) ──────────────

export async function activateSubscription(
  academyId: string,
  paymentRef: string
): Promise<void> {
  const now = new Date();

  const existing = await prisma.subscription.findUnique({
    where: { academyId },
    select: { subscriptionEndsAt: true, status: true },
  });

  // Si tiene suscripción activa vigente, extender desde esa fecha
  // Si no, extender desde hoy
  let baseDate = now;
  if (
    existing?.status === "ACTIVE" &&
    existing.subscriptionEndsAt &&
    existing.subscriptionEndsAt > now
  ) {
    baseDate = existing.subscriptionEndsAt;
  }

  const newEndsAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.update({
    where: { academyId },
    data: {
      status:             "ACTIVE",
      subscriptionEndsAt: newEndsAt,
      lastPaymentAt:      now,
      lastPaymentRef:     paymentRef,
    },
  });

  revalidatePath(`/${academyId}/subscription`);
}
