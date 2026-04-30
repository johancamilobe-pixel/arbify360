import { requireAcademyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  formatDate,
  formatTime,
  GAME_STATUS_LABELS,
  GAME_ROLE_LABELS,
  getGameStatusColor,
  formatCurrency,
  cn,
} from "@/lib/utils";
import { Calendar, MapPin, Users, Trophy, Flag } from "lucide-react";
import { GameStatusActions } from "./game-status-actions";
import { GameEditPanel } from "./game-edit-panel";
import { RefereeReplaceButton } from "./referee-replace-button";

interface Props {
  params: { academyId: string; gameId: string };
}

export async function generateMetadata() {
  return { title: "Detalle de Juego" };
}

export default async function GameDetailPage({ params }: Props) {
  const { academyId, gameId } = params;
  const context = await requireAcademyAccess(academyId);

  const game = await prisma.game.findUnique({
    where: { id: gameId, academyId },
    include: {
      sport: true,
      gameCategory: true,
      gamePhase: true,
      assignments: {
        include: {
          user: true,
          attendance: true,
        },
      },
      scoresheet: {
        include: {
          submissions: {
            include: { user: true, approvedBy: true },
          },
        },
      },
    },
  });

  if (!game) notFound();

  // Calcular egresos reales desde planillas aprobadas
  const totalEgresos = game.scoresheet?.submissions.reduce(
    (sum, s) =>
      s.status === "APPROVED" && s.paymentAmount
        ? sum + Number(s.paymentAmount)
        : sum,
    0
  ) ?? 0;

  const netProfit = (game.incomeAmount ? Number(game.incomeAmount) : 0) - totalEgresos;

  // Datos para el formulario de edición — árbitros actuales por rol
  const sports = await prisma.sport.findMany({
    where: { academySports: { some: { academyId } } },
    orderBy: { name: "asc" },
  });
  const categories = await prisma.gameCategory.findMany({
    where: { academyId },
    orderBy: { name: "asc" },
  });
  const phases = await prisma.gamePhase.findMany({
    where: { academyId },
    orderBy: { name: "asc" },
  });
  const referees = await prisma.academyMembership.findMany({
    where: { academyId, role: "REFEREE", isActive: true },
    include: {
      user: true,
      refereeCategory: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  // Árbitros actuales por rol
  const assignmentByRole = Object.fromEntries(
    game.assignments.map((a) => [a.role, a.userId])
  );

  // Referees formateados para el selector de reemplazo
  const refereesForReplace = referees.map((m) => ({
    id: m.userId,
    name: m.user.name,
    category: m.refereeCategory?.name ?? null,
    licenseNumber: m.user.licenseNumber ?? null,
  }));

  // Set de árbitros con planilla aprobada (no se pueden reemplazar)
  const approvedUserIds = new Set(
    game.scoresheet?.submissions
      .filter((s) => s.status === "APPROVED")
      .map((s) => s.userId) ?? []
  );

  // IDs de árbitros ya asignados a este juego (para filtrar en selector)
  const assignedUserIds = new Set(game.assignments.map((a) => a.userId));

  // Formatear fecha para datetime-local input
  function toDatetimeLocal(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Determinar si el juego permite reemplazos (no finalizado ni cancelado)
  const canReplace = game.status === "SCHEDULED" || game.status === "CONFIRMED";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {game.homeTeam} <span className="text-muted-foreground/70 font-normal">vs</span> {game.awayTeam}
          </h1>
          <p className="text-brand-600 font-medium mt-1">
            {game.sport.name} · {game.gameCategory.name}
            {game.gamePhase && ` · ${game.gamePhase.name}`}
          </p>
        </div>
        <span className={cn(
          "text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0",
          getGameStatusColor(game.status)
        )}>
          {GAME_STATUS_LABELS[game.status]}
        </span>
      </div>

      {/* Info del juego */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold text-foreground mb-4">Detalles</h2>

        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Fecha y hora">
          {formatDate(game.startTime)} · {formatTime(game.startTime)} – {formatTime(game.endTime)}
        </InfoRow>

        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Lugar">
          {game.venue}
        </InfoRow>

        <InfoRow icon={<Trophy className="w-4 h-4" />} label="Categoría">
          {game.gameCategory.name}
        </InfoRow>

        {game.gamePhase && (
          <InfoRow icon={<Flag className="w-4 h-4" />} label="Fase">
            {game.gamePhase.name}
          </InfoRow>
        )}
      </div>

      {/* Árbitros asignados */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Árbitros asignados</h2>
        </div>

        {game.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">Ningún árbitro asignado aún</p>
        ) : (
          <div className="space-y-3">
            {game.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{assignment.user.name}</p>
                    <p className="text-sm text-muted-foreground">{GAME_ROLE_LABELS[assignment.role]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.attendance ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Asistió · {formatTime(assignment.attendance.confirmedAt)}
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Sin confirmar
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón reemplazar — solo admin, juegos activos, sin planilla aprobada */}
                {context.role === "ADMIN" && canReplace && (
                  <div className="mt-2">
                    <RefereeReplaceButton
                      academyId={academyId}
                      gameId={gameId}
                      assignmentId={assignment.id}
                      currentUserId={assignment.userId}
                      currentUserName={assignment.user.name}
                      role={assignment.role}
                      referees={refereesForReplace}
                      hasApprovedSubmission={approvedUserIds.has(assignment.userId)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financiero — solo admin */}
      {context.role === "ADMIN" && game.incomeAmount && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Financiero</h2>
          <div className="space-y-2">
            <FinancialRow
              label="Ingreso (cobro a organización)"
              value={formatCurrency(Number(game.incomeAmount))}
              positive
            />
            {totalEgresos > 0 && (
              <FinancialRow
                label="Egresos (árbitros aprobados)"
                value={`−${formatCurrency(totalEgresos)}`}
              />
            )}
            <div className="border-t border-border/50 pt-2 mt-2">
              <FinancialRow
                label={totalEgresos > 0 ? "Ganancia neta" : "Ganancia estimada"}
                value={formatCurrency(netProfit)}
                positive={netProfit >= 0}
              />
            </div>
          </div>
          {totalEgresos === 0 && (
            <p className="text-xs text-muted-foreground/70 mt-3">
              * Los egresos se calculan al aprobar las planillas de cada árbitro
            </p>
          )}
        </div>
      )}

      {/* Planilla — resumen */}
      {game.scoresheet && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Planilla</h2>
          {game.scoresheet.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground/70">Ningún árbitro ha subido la planilla aún</p>
          ) : (
            <div className="space-y-3">
              {game.scoresheet.submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium text-foreground text-sm">{sub.user.name}</p>
                    <p className="text-xs text-muted-foreground">{GAME_ROLE_LABELS[sub.role]}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    sub.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    sub.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {sub.status === "APPROVED" ? "Aprobada" :
                     sub.status === "REJECTED" ? "Rechazada" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Acciones de estado — solo admin */}
      {context.role === "ADMIN" && (
        <GameStatusActions
          academyId={academyId}
          gameId={game.id}
          currentStatus={game.status}
        />
      )}

      {/* Panel editar / eliminar — solo admin */}
      {context.role === "ADMIN" && (
        <GameEditPanel
          academyId={academyId}
          gameId={gameId}
          sports={sports.map((s) => ({ id: s.id, name: s.name }))}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            incomePerGame: c.incomePerGame,
          }))}
          referees={refereesForReplace}
          phases={phases.map((p) => ({ id: p.id, name: p.name }))}
          defaults={{
            homeTeam:            game.homeTeam,
            awayTeam:            game.awayTeam,
            venue:               game.venue,
            sportId:             game.sportId,
            gameCategoryId:      game.gameCategoryId,
            gamePhaseId:         game.gamePhaseId ?? undefined,
            startTime:           toDatetimeLocal(game.startTime),
            endTime:             toDatetimeLocal(game.endTime),
            mainRefereeId:       assignmentByRole["MAIN_REFEREE"],
            secondaryRefereeId:  assignmentByRole["SECONDARY_REFEREE"],
            tableAssistantId:    assignmentByRole["TABLE_ASSISTANT"],
          }}
        />
      )}
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function InfoRow({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground/70 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground/70 uppercase tracking-wide">{label}</p>
        <p className="text-foreground text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, positive }: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={positive ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
        {value}
      </span>
    </div>
  );
}
