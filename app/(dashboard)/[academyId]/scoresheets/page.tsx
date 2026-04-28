import { requireAcademyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  formatDate,
  formatTime,
  cn,
} from "@/lib/utils";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";

interface Props {
  params: { academyId: string };
  searchParams: { filter?: string };
}

export const metadata = { title: "Planillas" };

export default async function ScoresheetsPage({ params, searchParams }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  const filter = searchParams.filter;

  // Traer juegos que tienen planilla o están finalizados/confirmados
  const games = await prisma.game.findMany({
    where: {
      academyId,
      status: { in: ["CONFIRMED", "FINISHED"] },
    },
    include: {
      sport: true,
      gameCategory: true,
      assignments: {
        include: { user: true },
      },
      scoresheet: {
        include: {
          submissions: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  // Calcular estado de planilla por juego
  const gamesWithStatus = games.map((game) => {
    const totalAssigned = game.assignments.length;
    const submissions = game.scoresheet?.submissions ?? [];
    const approved = submissions.filter((s) => s.status === "APPROVED").length;
    const pending  = submissions.filter((s) => s.status === "PENDING").length;
    const rejected = submissions.filter((s) => s.status === "REJECTED").length;
    const missing  = totalAssigned - submissions.length;

    let status: "complete" | "pending" | "incomplete";
    if (approved === totalAssigned && totalAssigned > 0) {
      status = "complete";
    } else if (pending > 0) {
      status = "pending";
    } else {
      status = "incomplete";
    }

    return { game, totalAssigned, approved, pending, rejected, missing, status };
  });

  // Filtrar
  const filtered = filter
    ? gamesWithStatus.filter((g) => g.status === filter)
    : gamesWithStatus;

  const tabs = [
    { label: "Todos",       value: undefined,      count: gamesWithStatus.length },
    { label: "Pendientes",  value: "pending",      count: gamesWithStatus.filter((g) => g.status === "pending").length },
    { label: "Incompletas", value: "incomplete",    count: gamesWithStatus.filter((g) => g.status === "incomplete").length },
    { label: "Completas",   value: "complete",      count: gamesWithStatus.filter((g) => g.status === "complete").length },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Planillas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Revisión de planillas de juegos confirmados y finalizados
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/${academyId}/scoresheets?filter=${tab.value}` : `/${academyId}/scoresheets`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === tab.value || (!filter && !tab.value)
                ? "bg-brand-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <ClipboardList className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay planillas para mostrar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ game, totalAssigned, approved, pending, rejected, missing, status }) => (
            <Link
              key={game.id}
              href={`/${academyId}/scoresheets/${game.id}`}
              className="block bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">
                    {game.homeTeam} <span className="text-muted-foreground/70 font-normal">vs</span> {game.awayTeam}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(game.startTime)} · {formatTime(game.startTime)} – {formatTime(game.endTime)}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {game.sport.name} · {game.gameCategory.name}
                  </p>
                </div>

                {/* Estado de planilla */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {status === "complete" && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Completa
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                      <Clock className="w-3 h-3" />
                      {pending} pendiente{pending !== 1 ? "s" : ""}
                    </span>
                  )}
                  {status === "incomplete" && (
                    <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                      <XCircle className="w-3 h-3" />
                      {missing} sin subir
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${totalAssigned > 0 ? (approved / totalAssigned) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground/70 flex-shrink-0">
                  {approved}/{totalAssigned}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
