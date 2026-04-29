import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Clock, CheckCircle2, Receipt } from "lucide-react";
import { RefereePagosDetalle } from "./referee-pagos-detalle";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Mis pagos" };

export default async function MyPaymentsPage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  // Solo árbitros
  if (context.role !== "REFEREE") redirect(`/${academyId}`);

  const user = await getDbUser();
  if (!user) redirect("/sign-in");

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

  const juegos = assignments.map((a) => {
    const sub = a.game.scoresheet?.submissions[0] ?? null;
    const pagado = !!sub?.paymentItem;
    return {
      gameId:      a.game.id,
      homeTeam:    a.game.homeTeam,
      awayTeam:    a.game.awayTeam,
      sport:       a.game.sport.name,
      category:    a.game.gameCategory.name,
      date:        formatDate(a.game.startTime),
      subStatus:   sub?.status ?? null,
      monto:       sub?.paymentAmount ? formatCurrency(Number(sub.paymentAmount)) : null,
      montoRaw:    sub?.paymentAmount ? Number(sub.paymentAmount) : 0,
      pagado,
      pagoFecha:   sub?.paymentItem?.payment?.paidAt
        ? formatDate(sub.paymentItem.payment.paidAt)
        : null,
      pagoRecibo:  sub?.paymentItem?.payment?.receiptNumber ?? null,
      pagoMetodo:  sub?.paymentItem?.payment?.method ?? null,
    };
  });

  const pendientes = juegos.filter((j) => !j.pagado && j.subStatus === "APPROVED");
  const pagados    = juegos.filter((j) => j.pagado);
  const sinPlanilla = juegos.filter((j) => !j.pagado && j.subStatus !== "APPROVED");

  const totalPendiente = pendientes.reduce((s, j) => s + j.montoRaw, 0);
  const totalPagado    = pagados.reduce((s, j) => s + j.montoRaw, 0);

  const METODO_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    BANK_TRANSFER: "Transferencia",
    NEQUI: "Nequi",
    DAVIPLATA: "Daviplata",
  };

  const pagosData = {
    pendientes: pendientes.map((j) => ({ ...j, montoRaw: undefined })),
    pagados:    pagados.map((j) => ({
      ...j,
      montoRaw: undefined,
      pagoMetodoLabel: j.pagoMetodo ? (METODO_LABELS[j.pagoMetodo] ?? j.pagoMetodo) : null,
    })),
    sinPlanilla: sinPlanilla.map((j) => ({ ...j, montoRaw: undefined })),
    totalPendiente: formatCurrency(totalPendiente),
    totalPagado:    formatCurrency(totalPagado),
    totalJuegos:    juegos.length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis pagos</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus cobros por juegos arbitrados
          </p>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">Por cobrar</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{pagosData.totalPendiente}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendientes.length} juego{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">Ya cobrado</p>
          <p className="text-xl font-bold text-green-600 mt-1">{pagosData.totalPagado}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagados.length} juego{pagados.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">Total juegos</p>
          <p className="text-xl font-bold text-foreground mt-1">{pagosData.totalJuegos}</p>
          <p className="text-xs text-muted-foreground mt-0.5">asignados</p>
        </div>
      </div>

      {/* Detalle con tabs */}
      <RefereePagosDetalle pagos={JSON.parse(JSON.stringify(pagosData))} />
    </div>
  );
}
