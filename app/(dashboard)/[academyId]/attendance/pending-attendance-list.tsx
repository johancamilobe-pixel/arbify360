"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAttendance } from "@/actions/attendance";
import { Check, Calendar, MapPin, Loader2 } from "lucide-react";
import { cn, GAME_ROLE_LABELS, formatDate, formatTime } from "@/lib/utils";

interface PendingGame {
  assignmentId: string;
  gameId:       string;
  homeTeam:     string;
  awayTeam:     string;
  venue:        string;
  startTime:    string;
  endTime:      string;
  sport:        string;
  category:     string;
  role:         string;
  status:       string;
}

interface Props {
  academyId: string;
  games:     PendingGame[];
}

export function PendingAttendanceList({ academyId, games }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm(gameId: string) {
    startTransition(async () => {
      const result = await confirmAttendance(academyId, gameId);
      if (result.success) router.refresh();
    });
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <Check className="w-10 h-10 text-green-300 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No tienes juegos pendientes de confirmar</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Todo al día</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => (
        <div key={game.assignmentId} className="bg-card rounded-xl border border-yellow-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">
                {game.homeTeam} <span className="text-muted-foreground/70 font-normal text-sm">vs</span> {game.awayTeam}
              </p>
              <p className="text-sm text-brand-600 font-medium mt-0.5">
                {game.sport} · {game.category}
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" /> {game.startTime}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {game.venue}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Rol: {GAME_ROLE_LABELS[game.role] ?? game.role}
              </p>
            </div>

            <button
              onClick={() => handleConfirm(game.gameId)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-70 flex-shrink-0"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
