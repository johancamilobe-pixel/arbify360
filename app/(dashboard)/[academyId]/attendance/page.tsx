import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, GAME_ROLE_LABELS, GAME_STATUS_LABELS } from "@/lib/utils";
import { PendingAttendanceList } from "./pending-attendance-list";
import { ClipboardCheck, Calendar, Users } from "lucide-react";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Asistencia" };

export default async function AttendancePage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);
  const user    = await getDbUser();
  if (!user) return null;

  if (context.role === "REFEREE") {
    // Vista árbitro: juegos pendientes de confirmar
    const assignments = await prisma.gameAssignment.findMany({
      where: {
        userId: user.id,
        game: {
          academyId,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        attendance: null,
      },
      include: {
        game: {
          include: { sport: true, gameCategory: true },
        },
      },
      orderBy: { game: { startTime: "asc" } },
    });

    const pendingGames = assignments.map((a) => ({
      assignmentId: a.id,
      gameId:       a.gameId,
      homeTeam:     a.game.homeTeam,
      awayTeam:     a.game.awayTeam,
      venue:        a.game.venue,
      startTime:    `${formatDate(a.game.startTime)} · ${formatTime(a.game.startTime)}`,
      endTime:      formatTime(a.game.endTime),
      sport:        a.game.sport.name,
      category:     a.game.gameCategory.name,
      role:         a.role,
      status:       a.game.status,
    }));

    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Confirmar asistencia</h1>
            <p className="text-sm text-muted-foreground">
              {pendingGames.length} juego{pendingGames.length !== 1 ? "s" : ""} pendiente{pendingGames.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <PendingAttendanceList academyId={academyId} games={pendingGames} />
      </div>
    );
  }

  // Vista admin: resumen de asistencia de próximos juegos
  const upcomingGames = await prisma.game.findMany({
    where: {
      academyId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: {
      sport: true,
      gameCategory: true,
      assignments: {
        include: {
          user: true,
          attendance: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asistencia</h1>
          <p className="text-sm text-muted-foreground">Estado de confirmación por juego</p>
        </div>
      </div>

      {upcomingGames.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay juegos próximos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingGames.map((game) => {
            const total     = game.assignments.length;
            const confirmed = game.assignments.filter((a) => a.attendance).length;
            const allDone   = total > 0 && confirmed === total;

            return (
              <div key={game.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                {/* Header juego */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">
                      {game.homeTeam} <span className="text-muted-foreground/70 font-normal text-sm">vs</span> {game.awayTeam}
                    </p>
                    <p className="text-sm text-brand-600 font-medium">{game.sport.name} · {game.gameCategory.name}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDate(game.startTime)} · {formatTime(game.startTime)} – {formatTime(game.endTime)} · {game.venue}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    allDone ? "bg-green-100 text-green-700" :
                    confirmed > 0 ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {confirmed}/{total}
                  </span>
                </div>

                {/* Árbitros */}
                {total === 0 ? (
                  <p className="text-xs text-muted-foreground/70">Sin árbitros asignados</p>
                ) : (
                  <div className="space-y-1.5">
                    {game.assignments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        {a.attendance ? (
                          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          </span>
                        )}
                        <span className={a.attendance ? "text-foreground" : "text-muted-foreground/70"}>
                          {a.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground/70">{GAME_ROLE_LABELS[a.role] ?? a.role}</span>
                        {a.attendance && a.attendance.latitude && (
                          <a
                            href={`https://www.google.com/maps?q=${a.attendance.latitude},${a.attendance.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:underline ml-auto"
                          >
                            GPS
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
