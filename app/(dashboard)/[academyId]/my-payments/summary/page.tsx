import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime, GAME_ROLE_LABELS } from "@/lib/utils";
import { RefereeSummaryView } from "./referee-summary-view";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Resumen de juegos" };

export default async function RefereeSummaryPage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);
  if (context.role !== "REFEREE") redirect(`/${academyId}`);

  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const academy = await prisma.academy.findUnique({ where: { id: academyId } });

  const assignments = await prisma.gameAssignment.findMany({
    where: { userId: user.id, game: { academyId } },
    include: {
      game: {
        include: {
          sport: true,
          gameCategory: true,
          scoresheet: {
            include: {
              submissions: {
                where: { userId: user.id },
                include: {
                  paymentItem: { include: { payment: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { game: { startTime: "asc" } },
  });

  const METHOD_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    BANK_TRANSFER: "Transferencia bancaria",
    NEQUI: "Nequi",
    DAVIPLATA: "Daviplata",
  };

  const juegos = assignments.map((a) => {
    const sub = a.game.scoresheet?.submissions[0] ?? null;
    const pagado = !!sub?.paymentItem;
    const metodo = sub?.paymentItem?.payment?.method ?? null;
    const montoRaw = sub?.paymentAmount ? Number(sub.paymentAmount) : 0;
    return {
      gameId:          a.game.id,
      homeTeam:        a.game.homeTeam,
      awayTeam:        a.game.awayTeam,
      sport:           a.game.sport.name,
      category:        a.game.gameCategory.name,
      venue:           a.game.venue,
      startTime:       formatDateTime(a.game.startTime),
      role:            GAME_ROLE_LABELS[a.role] ?? a.role,
      subStatus:       sub?.status ?? null,
      monto:           montoRaw > 0 ? formatCurrency(montoRaw) : "—",
      montoRaw,
      pagado,
      pagoFecha:       sub?.paymentItem?.payment?.paidAt
        ? formatDate(sub.paymentItem.payment.paidAt)
        : null,
      pagoRecibo:      sub?.paymentItem?.payment?.receiptNumber ?? null,
      pagoMetodoLabel: metodo ? (METHOD_LABELS[metodo] ?? metodo) : null,
    };
  });

  const totalPagado    = juegos.filter((j) => j.pagado).reduce((s, j) => s + j.montoRaw, 0);
  const totalPendiente = juegos.filter((j) => !j.pagado && j.subStatus === "APPROVED").reduce((s, j) => s + j.montoRaw, 0);

  const summary = {
    refereeName:     context.user.name,
    refereeEmail:    context.user.email,
    academyName:     academy?.name ?? "",
    generatedAt:     formatDate(new Date()),
    totalJuegos:     juegos.length,
    totalPagado:     formatCurrency(totalPagado),
    totalPendiente:  formatCurrency(totalPendiente),
    juegos:          juegos.map(({ montoRaw, ...j }) => j),
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <RefereeSummaryView summary={JSON.parse(JSON.stringify(summary))} academyId={academyId} />
    </div>
  );
}
