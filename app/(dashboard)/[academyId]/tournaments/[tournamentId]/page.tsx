import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatTime, GAME_STATUS_LABELS, getGameStatusColor, GAME_ROLE_LABELS, cn } from "@/lib/utils";
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Flag } from "lucide-react";
import Link from "next/link";
import { TournamentForm } from "../tournament-form";
import { TournamentActions } from "./tournament-actions";

interface Props {
  params: { academyId: string; tournamentId: string };
}

export async function generateMetadata({ params }: Props) {
  const t = await prisma.tournament.findUnique({ where: { id: params.tournamentId } });
  return { title: t?.name ?? "Torneo" };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { academyId, tournamentId } = params;
  await requireAdminRole(academyId);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId, academyId },
    include: {
      games: {
        include: {
          sport: true,
          gameCategory: true,
          gamePhase: true,
          assignments: {
            include: { user: true },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  // Agrupar juegos por fase
  const gamesByPhase: Record<string, typeof tournament.games> = {};
  const noPhaseGames: typeof tournament.games = [];

  for (const game of tournament.games) {
    if (game.gamePhase) {
      const key = game.gamePhase.name;
      if (!gamesByPhase[key]) gamesByPhase[key] = [];
      gamesByPhase[key].push(game);
    } else {
      noPhaseGames.push(game);
    }
  }

  const totalGames    = tournament.games.length;
  const finishedGames = tournament.games.filter((g) => g.status === "FINISHED").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/${academyId}/tournaments`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a torneos
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                tournament.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              )}>
                {tournament.status === "ACTIVE" ? "Activo" : "Finalizado"}
              </span>
            </div>
            {tournament.description && (
              <p className="text-sm text-muted-foreground mt-1">{tournament.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground/70">
              {tournament.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(tournament.startDate)}
                  {tournament.endDate && ` → ${formatDate(tournament.endDate)}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {totalGames} juego{totalGames !== 1 ? "s" : ""} · {finishedGames} finalizado{finishedGames !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Barra progreso */}
            {totalGames > 0 && (
              <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${(finishedGames / totalGames) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <TournamentForm
              academyId={academyId}
              mode="edit"
              tournamentId={tournamentId}
              defaults={{
                name:        tournament.name,
                description: tournament.description ?? "",
                startDate:   tournament.startDate?.toISOString().slice(0, 10) ?? "",
                endDate:     tournament.endDate?.toISOString().slice(0, 10) ?? "",
              }}
            />
            <TournamentActions
              academyId={academyId}
              tournamentId={tournamentId}
              currentStatus={tournament.status}
            />
          </div>
        </div>
      </div>

      {/* Botón agregar juego */}
      <div className="flex justify-end">
        <Link
          href={`/${academyId}/games/new?tournamentId=${tournamentId}`}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Trophy className="w-4 h-4" />
          Agregar juego al torneo
        </Link>
      </div>

      {/* Juegos sin fase */}
      {noPhaseGames.length > 0 && (
        <GameGroup title="Sin fase asignada" games={noPhaseGames} academyId={academyId} />
      )}

      {/* Juegos agrupados por fase */}
      {Object.entries(gamesByPhase).map(([phase, games]) => (
        <GameGroup key={phase} title={phase} games={games} academyId={academyId} />
      ))}

      {totalGames === 0 && (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Trophy className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Este torneo no tiene juegos aún</p>
          <Link
            href={`/${academyId}/games/new?tournamentId=${tournamentId}`}
            className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Agregar el primer juego →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Componente grupo de juegos por fase ─────────────────────────────────────

function GameGroup({
  title,
  games,
  academyId,
}: {
  title: string;
  games: any[];
  academyId: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-brand-500" />
        <h2 className="font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {games.length} juego{games.length !== 1 ? "s" : ""}
        </span>
      </div>

      {games.map((game) => (
        <Link
          key={game.id}
          href={`/${academyId}/games/${game.id}`}
          className="block bg-card rounded-xl border border-border p-4 hover:border-brand-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {game.homeTeam} <span className="text-muted-foreground/70 font-normal text-sm">vs</span> {game.awayTeam}
              </p>
              <p className="text-sm text-brand-600 font-medium mt-0.5">
                {game.sport.name} · {game.gameCategory.name}
              </p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(game.startTime)} · {formatTime(game.startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {game.venue}
                </span>
              </div>
            </div>
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0",
              getGameStatusColor(game.status)
            )}>
              {GAME_STATUS_LABELS[game.status]}
            </span>
          </div>

          {/* Árbitros */}
          {game.assignments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <div className="flex flex-wrap gap-2">
                {game.assignments.map((a: any) => (
                  <span key={a.id} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {a.user.name} · {GAME_ROLE_LABELS[a.role] ?? a.role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
