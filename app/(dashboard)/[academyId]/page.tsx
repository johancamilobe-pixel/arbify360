import { requireAcademyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, GAME_STATUS_LABELS, getGameStatusColor, cn } from "@/lib/utils";
import { activateSubscription } from "@/actions/subscription";
import { PaymentRefresh } from "./payment-refresh";

interface Props {
  params: { academyId: string };
  searchParams: { id?: string; env?: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "Inicio" };
}

export default async function DashboardPage({ params, searchParams }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  // ─── Verificar pago WOMPI si viene de redirección ─────────────────────────
  const transactionId = searchParams.id;
  if (transactionId) {
    try {
      const wompiApiUrl = `https://sandbox.wompi.co/v1/transactions/${transactionId}`;
      const res = await fetch(wompiApiUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const tx = data.data;

        if (tx?.status === "APPROVED") {
          // Extraer academyId de la referencia: {academyId}-{timestamp}
          const reference: string = tx.reference ?? "";
          const parts = reference.split("-");
          const lastPart = parts[parts.length - 1];
          const isTimestamp = /^\d+$/.test(lastPart);
          const refAcademyId = isTimestamp
            ? parts.slice(0, -1).join("-")
            : reference;

          if (refAcademyId === academyId) {
            await activateSubscription(academyId, tx.id);
          }
        }
      }
    } catch {
      // Si falla la verificación, continuar normalmente
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Próximos juegos (máximo 5)
  const upcomingGames = await prisma.game.findMany({
    where: {
      academyId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startTime: { gte: new Date() },
    },
    include: {
      gameCategory: true,
      sport: true,
      assignments: {
        include: { user: true },
      },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  // Estadísticas del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthlyGamesCount = await prisma.game.count({
    where: {
      academyId,
      startTime: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const pendingScoreSheetsCount = await prisma.scoresheetSubmission.count({
    where: {
      status: "PENDING",
      scoresheet: { game: { academyId } },
    },
  });

  const totalReferees = await prisma.academyMembership.count({
    where: { academyId, role: "REFEREE", isActive: true },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Auto-refresh tras pago WOMPI */}
      {transactionId && (
        <PaymentRefresh transactionId={transactionId} academyId={academyId} />
      )}
      {/* Bienvenida */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {context.academyName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Tarjetas de estadísticas — solo admin */}
      {context.role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Juegos este mes"      value={monthlyGamesCount}        color="brand"  />
          <StatCard label="Planillas pendientes" value={pendingScoreSheetsCount}  color={pendingScoreSheetsCount > 0 ? "yellow" : "green"} />
          <StatCard label="Árbitros activos"     value={totalReferees}            color="gray"   />
        </div>
      )}

      {/* Próximos juegos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Próximos juegos</h2>
          <a href={`/${academyId}/games`} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Ver todos →
          </a>
        </div>

        {upcomingGames.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground/70">No hay juegos programados próximamente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingGames.map((game) => (
              <a
                key={game.id}
                href={`/${academyId}/games/${game.id}`}
                className="block bg-card rounded-xl border border-border p-4 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {game.homeTeam} <span className="text-muted-foreground/70 font-normal">vs</span> {game.awayTeam}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(game.startTime)} · {formatTime(game.startTime)} – {formatTime(game.endTime)}
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {game.venue} · {game.sport.name} · {game.gameCategory.name}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0",
                    getGameStatusColor(game.status)
                  )}>
                    {GAME_STATUS_LABELS[game.status]}
                  </span>
                </div>

                {game.assignments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex gap-4 flex-wrap">
                    {game.assignments.map((a) => (
                      <span key={a.id} className="text-xs text-muted-foreground">{a.user.name}</span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: {
  label: string;
  value: number;
  color: "brand" | "green" | "yellow" | "gray";
}) {
  const colors = {
    brand:  "bg-brand-500 text-white",
    green:  "bg-green-500 text-white",
    yellow: "bg-yellow-500 text-white",
    gray:   "bg-muted text-foreground",
  };

  return (
    <div className={cn("rounded-xl p-5", colors[color])}>
      <p className={cn("text-3xl font-bold", color === "gray" ? "text-foreground" : "text-white")}>
        {value}
      </p>
      <p className={cn("text-sm mt-1", color === "gray" ? "text-muted-foreground" : "text-white/80")}>
        {label}
      </p>
    </div>
  );
}
