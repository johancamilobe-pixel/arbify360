import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, FileText } from "lucide-react";
import { RefereePagosDetalle } from "./referee-pagos-detalle";
import Link from "next/link";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Mis pagos" };

export default async function MyPaymentsPage({ params }: Props) {
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

  const METODO_LABELS: Record<string, string> = {
    CASH: "Efectivo",
    BANK_TRANSFER: "Transferencia bancaria",
    NEQUI: "Nequi",
    DAVIPLATA: "Daviplata",
  };

  const juegos = assignments.map((a) => {
    const sub = a.game.scoresheet?.submissions[0] ?? null;
    const pagado = !!sub?.paymentItem;
    const metodo = sub?.paymentItem?.payment?.method ?? null;
    return {
      gameId:          a.game.id,
      homeTeam:        a.game.homeTeam,
      awayTeam:        a.game.awayTeam,
      sport:           a.game.sport.name,
      category:        a.game.gameCategory.name,
      date:            formatDate(a.game.startTime),
      subStatus:       sub?.status ?? null,
      monto:           sub?.paymentAmount ? formatCurrency(Number(sub.paymentAmount)) : null,
      montoRaw:        sub?.paymentAmount ? Number(sub.paymentAmount) : 0,
      pagado,
      paymentId:       sub?.paymentItem?.payment?.id ?? null,
      pagoFecha:       sub?.paymentItem?.payment?.paidAt
        ? formatDate(sub.paymentItem.payment.paidAt)
        : null,
      pagoRecibo:      sub?.paymentItem?.payment?.receiptNumber ?? null,
      pagoMetodo:      metodo,
      pagoMetodoLabel: metodo ? (METODO_LABELS[metodo] ?? metodo) : null,
    };
  });

  const pendientes  = juegos.filter((j) => !j.pagado && j.subStatus === "APPROVED");
  const pagados     = juegos.filter((j) => j.pagado);
  const sinPlanilla = juegos.filter((j) => !j.pagado && j.subStatus !== "APPROVED");

  const totalPendiente = pendientes.reduce((s, j) => s + j.montoRaw, 0);
  const totalPagado    = pagados.reduce((s, j) => s + j.montoRaw, 0);

  const pagosData = {
    pendientes:     pendientes.map(({ montoRaw, ...j }) => j),
    pagados:        pagados.map(({ montoRaw, ...j }) => j),
    sinPlanilla:    sinPlanilla.map(({ montoRaw, ...j }) => j),
    totalPendiente: formatCurrency(totalPendiente),
    totalPagado:    formatCurrency(totalPagado),
    totalJuegos:    juegos.length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
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
        {/* Botón resumen completo */}
        {juegos.length > 0 && (
          <Link
            href={`/${academyId}/my-payments/summary`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ver resumen
          </Link>
        )}
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
      <RefereePagosDetalle
        pagos={JSON.parse(JSON.stringify(pagosData))}
        academyId={academyId}
      />
    </div>
  );
}
