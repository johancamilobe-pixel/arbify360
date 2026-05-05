import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  formatDate,
  formatCurrency,
  getInitials,
  GAME_ROLE_LABELS,
  GAME_STATUS_LABELS,
  getGameStatusColor,
  cn,
} from "@/lib/utils";
import { RefereeActions } from "./referee-actions";
import { RefereeProfileCard } from "./referee-profile-card";

interface Props {
  params: { academyId: string; refereeId: string };
}

function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? age : null;
}

export async function generateMetadata({ params }: Props) {
  const user = await prisma.user.findUnique({ where: { id: params.refereeId } });
  return { title: user?.name ?? "Árbitro" };
}

export default async function RefereeDetailPage({ params }: Props) {
  const { academyId, refereeId } = params;
  await requireAdminRole(academyId);

  const membership = await prisma.academyMembership.findUnique({
    where: { userId_academyId: { userId: refereeId, academyId } },
    include: { user: true, refereeCategory: true, academy: true },
  });

  if (!membership) notFound();

  const user = membership.user;
  const age = calculateAge(user.birthDate);

  const categories = await prisma.refereeCategory.findMany({
    where: { academyId },
    orderBy: { name: "asc" },
  });

  const assignments = await prisma.gameAssignment.findMany({
    where: { userId: refereeId, game: { academyId } },
    include: {
      game: {
        include: {
          sport: true,
          gameCategory: true,
          scoresheet: {
            include: { submissions: { where: { userId: refereeId } } },
          },
        },
      },
    },
    orderBy: { game: { startTime: "desc" } },
  });

  const totalEarned = assignments.reduce((sum, a) => {
    const sub = a.game.scoresheet?.submissions[0];
    return sub?.status === "APPROVED" && sub.paymentAmount
      ? sum + Number(sub.paymentAmount)
      : sum;
  }, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const approvedThisMonth = assignments.filter((a) => {
    const sub = a.game.scoresheet?.submissions[0];
    return sub?.status === "APPROVED" && new Date(a.game.startTime) >= startOfMonth;
  }).length;

  const birthDateStr = user.birthDate
    ? user.birthDate.toISOString().slice(0, 10)
    : undefined;

  // Datos planos para el Client Component — sin íconos ni JSX
  const profileData = {
    userId:         user.id,
    academyId:      academyId,
    name:           user.name,
    photoUrl:       user.photoUrl ?? null,
    email:          user.email,
    phone:          user.phone ?? null,
    phone2:         user.phone2 ?? null,
    documentType:   user.documentType ?? null,
    documentNumber: user.documentNumber ?? null,
    birthDate:      user.birthDate ? formatDate(user.birthDate) : null,
    age:            age,
    licenseNumber:  user.licenseNumber ?? null,
    categoryName:   membership.refereeCategory?.name ?? null,
    isActive:       membership.isActive,
    ratePerGame:    membership.refereeCategory?.ratePerGame ? formatCurrency(membership.refereeCategory.ratePerGame) : null,
  };

  const statsData = {
    total:        assignments.length,
    thisMonth:    approvedThisMonth,
    totalEarned:  formatCurrency(totalEarned),
  };

  const historyData = assignments.map((a) => {
    const sub = a.game.scoresheet?.submissions[0];
    return {
      id:            a.id,
      homeTeam:      a.game.homeTeam,
      awayTeam:      a.game.awayTeam,
      startTime:     formatDate(a.game.startTime),
      role:          GAME_ROLE_LABELS[a.role],
      status:        a.game.status,
      statusLabel:   GAME_STATUS_LABELS[a.game.status],
      statusColor:   getGameStatusColor(a.game.status),
      paymentAmount: sub?.status === "APPROVED" && sub.paymentAmount
        ? formatCurrency(sub.paymentAmount)
        : null,
    };
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <RefereeProfileCard
        profile={profileData}
        stats={statsData}
        history={historyData}
      />

      <RefereeActions
        academyId={academyId}
        userId={refereeId}
        isActive={membership.isActive}
        categories={categories}
        defaults={{
          email:             user.email,
          firstName:         user.firstName ?? "",
          lastName:          user.lastName ?? "",
          documentType:      user.documentType ?? undefined,
          documentNumber:    user.documentNumber ?? undefined,
          birthDate:         birthDateStr,
          phone:             user.phone ?? undefined,
          phone2:            user.phone2 ?? undefined,
          licenseNumber:     user.licenseNumber ?? undefined,
          refereeCategoryId: membership.refereeCategoryId ?? undefined,
          
        }}
      />
    </div>
  );
}
