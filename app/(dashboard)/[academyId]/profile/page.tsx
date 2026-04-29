import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { ProfileInfoCard } from "./profile-info-card";
import { RefereePagosCard } from "./referee-pagos-card";
import { User } from "lucide-react";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);
  const user = await getDbUser();
  if (!user) return null;

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return null;

  const membership = await prisma.academyMembership.findUnique({
    where: { userId_academyId: { userId: user.id, academyId } },
    include: { refereeCategory: true },
  });

  // Estadísticas y pagos — solo para árbitros
  let assignments: any[] = [];
  let pagosData: any = null;

  if (context.role === "REFEREE") {
    assignments = await prisma.gameAssignment.findMany({
      where: { userId: user.id, game: { academyId } },
      include: {
        game: {
          include: {
            sport: true,
            scoresheet: {
              include: {
                submissions: {
                  where: { userId: user.id },
                  include: {
                    paymentItem: {
                      include: { payment: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { game: { startTime: "desc" } },
    });

    // Agrupar juegos por estado de pago
    const juegosConSubmission = assignments
      .map((a) => {
        const sub = a.game.scoresheet?.submissions[0] ?? null;
        const pagado = !!sub?.paymentItem;
        return {
          gameId:      a.game.id,
          homeTeam:    a.game.homeTeam,
          awayTeam:    a.game.awayTeam,
          sport:       a.game.sport.name,
          date:        formatDate(a.game.startTime),
          subStatus:   sub?.status ?? null,
          monto:       sub?.paymentAmount ? Number(sub.paymentAmount) : null,
          pagado,
          pagoFecha:   sub?.paymentItem?.payment?.paidAt
            ? formatDate(sub.paymentItem.payment.paidAt)
            : null,
          pagoRecibo:  sub?.paymentItem?.payment?.receiptNumber ?? null,
        };
      });

    const pagados   = juegosConSubmission.filter((j) => j.pagado);
    const pendientes = juegosConSubmission.filter(
      (j) => !j.pagado && j.subStatus === "APPROVED"
    );
    const totalPagado   = pagados.reduce((s, j) => s + (j.monto ?? 0), 0);
    const totalPendiente = pendientes.reduce((s, j) => s + (j.monto ?? 0), 0);

    pagosData = {
      pagados:        pagados.map((j) => ({ ...j, monto: j.monto ? formatCurrency(j.monto) : "—" })),
      pendientes:     pendientes.map((j) => ({ ...j, monto: j.monto ? formatCurrency(j.monto) : "—" })),
      totalPagado:    formatCurrency(totalPagado),
      totalPendiente: formatCurrency(totalPendiente),
    };
  }

  const totalGames = assignments.length;
  const totalEarned = assignments.reduce((sum, a) => {
    const sub = a.game.scoresheet?.submissions[0];
    return sub?.status === "APPROVED" && sub.paymentAmount
      ? sum + Number(sub.paymentAmount)
      : sum;
  }, 0);

  const birthDateStr = fullUser.birthDate
    ? fullUser.birthDate.toISOString().slice(0, 10)
    : undefined;

  const profileInfo = {
    role:         context.role,
    categoryName: membership?.refereeCategory?.name ?? null,
    ratePerGame:  membership?.refereeCategory?.ratePerGame
      ? formatCurrency(membership.refereeCategory.ratePerGame)
      : null,
    totalGames,
    totalEarned:  formatCurrency(totalEarned),
    memberSince:  fullUser.createdAt.toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">Revisa y actualiza tus datos personales</p>
        </div>
      </div>

      {/* Info card */}
      <ProfileInfoCard profile={profileInfo} />

      {/* Sección de pagos — solo árbitros */}
      {context.role === "REFEREE" && pagosData && (
        <RefereePagosCard pagos={JSON.parse(JSON.stringify(pagosData))} />
      )}

      {/* Formulario */}
      <ProfileForm
        academyId={academyId}
        defaults={{
          firstName:      fullUser.firstName ?? "",
          lastName:       fullUser.lastName ?? "",
          email:          fullUser.email,
          documentType:   fullUser.documentType ?? undefined,
          documentNumber: fullUser.documentNumber ?? undefined,
          birthDate:      birthDateStr,
          phone:          fullUser.phone ?? undefined,
          phone2:         fullUser.phone2 ?? undefined,
          licenseNumber:  fullUser.licenseNumber ?? undefined,
        }}
      />
    </div>
  );
}
