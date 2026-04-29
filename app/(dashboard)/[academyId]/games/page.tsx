import { requireAcademyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  formatDate,
  formatTime,
  GAME_STATUS_LABELS,
  getGameStatusColor,
  GAME_ROLE_LABELS,
  cn,
} from "@/lib/utils";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { GamesSearch } from "./games-search";

interface Props {
  params: { academyId: string };
  searchParams: { status?: string };
}

export const metadata = { title: "Juegos" };

export default async function GamesPage({ params, searchParams }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  const statusFilter = searchParams.status;
  const isReferee = context.role === "REFEREE";

  const games = await prisma.game.findMany({
    where: {
      academyId,
      ...(statusFilter ? { status: statusFilter as any } : {}),
      // Árbitro: solo ve juegos donde está asignado actualmente
      ...(isReferee
        ? { assignments: { some: { userId: context.user.id } } }
        : {}),
    },
    include: {
      sport: true,
      gameCategory: true,
      assignments: {
        include: { user: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const statusTabs = [
    { label: "Todos",       value: undefined },
    { label: "Programados", value: "SCHEDULED" },
    { label: "Confirmados", value: "CONFIRMED" },
    { label: "Finalizados", value: "FINISHED" },
    { label: "Cancelados",  value: "CANCELLED" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Juegos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isReferee
              ? `${games.length} juego${games.length !== 1 ? "s" : ""} asignado${games.length !== 1 ? "s" : ""}`
              : `${games.length} juego${games.length !== 1 ? "s" : ""} encontrado${games.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {context.role === "ADMIN" && (
          <Link
            href={`/${academyId}/games/new`}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo juego
          </Link>
        )}
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/${academyId}/games?status=${tab.value}` : `/${academyId}/games`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              statusFilter === tab.value || (!statusFilter && !tab.value)
                ? "bg-brand-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {games.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {isReferee ? "No tienes juegos asignados" : "No hay juegos"}
          </p>
          {context.role === "ADMIN" && (
            <Link
              href={`/${academyId}/games/new`}
              className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Crear el primer juego →
            </Link>
          )}
        </div>
      ) : (
        <GamesSearch
          academyId={academyId}
          isAdmin={context.role === "ADMIN"}
          games={games.map((g) => ({
            id:          g.id,
            homeTeam:    g.homeTeam,
            awayTeam:    g.awayTeam,
            sport:       g.sport.name,
            category:    g.gameCategory.name,
            venue:       g.venue,
            date:        formatDate(g.startTime),
            time:        `${formatTime(g.startTime)} – ${formatTime(g.endTime)}`,
            status:      g.status,
            statusLabel: GAME_STATUS_LABELS[g.status],
            statusColor: getGameStatusColor(g.status),
            referees:    g.assignments.map((a) => a.user.name),
            noReferees:  g.assignments.length === 0,
          }))}
        />
      )}
    </div>
  );
}
