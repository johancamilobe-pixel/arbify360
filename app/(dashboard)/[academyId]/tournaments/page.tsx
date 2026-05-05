import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, cn } from "@/lib/utils";
import { Trophy, Plus, Calendar, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { TournamentForm } from "./tournament-form";

interface Props {
  params: { academyId: string };
  searchParams: { status?: string };
}

export const metadata = { title: "Torneos" };

export default async function TournamentsPage({ params, searchParams }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const statusFilter = searchParams.status as "ACTIVE" | "FINISHED" | undefined;

  const tournaments = await prisma.tournament.findMany({
    where: {
      academyId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      _count: { select: { games: true } },
      games: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeCount   = tournaments.filter((t) => t.status === "ACTIVE").length;
  const finishedCount = tournaments.filter((t) => t.status === "FINISHED").length;

  const tabs = [
    { label: "Todos",       value: undefined,    count: tournaments.length },
    { label: "Activos",     value: "ACTIVE",     count: activeCount },
    { label: "Finalizados", value: "FINISHED",   count: finishedCount },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Torneos</h1>
            <p className="text-sm text-muted-foreground">
              {tournaments.length} torneo{tournaments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <TournamentForm academyId={academyId} mode="create" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/${academyId}/tournaments?status=${tab.value}` : `/${academyId}/tournaments`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              statusFilter === tab.value || (!statusFilter && !tab.value)
                ? "bg-brand-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {/* Lista */}
      {tournaments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Trophy className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay torneos registrados</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Crea el primer torneo para empezar a organizar los juegos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const finishedGames = t.games.filter((g) => g.status === "FINISHED").length;
            const totalGames    = t._count.games;
            const progress      = totalGames > 0 ? (finishedGames / totalGames) * 100 : 0;

            return (
              <Link
                key={t.id}
                href={`/${academyId}/tournaments/${t.id}`}
                className="block bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground truncate">{t.name}</p>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                        t.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {t.status === "ACTIVE" ? "Activo" : "Finalizado"}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{t.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground/70">
                      {t.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(t.startDate)}
                          {t.endDate && ` → ${formatDate(t.endDate)}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {totalGames} juego{totalGames !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{finishedGames}/{totalGames}</p>
                    <p className="text-xs text-muted-foreground/70">finalizados</p>
                  </div>
                </div>

                {/* Barra progreso */}
                {totalGames > 0 && (
                  <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
