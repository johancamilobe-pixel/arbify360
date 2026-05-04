"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondAttendance } from "@/actions/attendance";
import { Check, X, Calendar, MapPin, Loader2, MessageSquare } from "lucide-react";
import { GAME_ROLE_LABELS } from "@/lib/utils";

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

function GameResponseCard({ game, academyId }: { game: PendingGame; academyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "accept" | "reject">(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleRespond(response: "ACCEPTED" | "REJECTED") {
    setError(null);
    if (response === "REJECTED" && !comment.trim()) {
      setError("Debes indicar el motivo por el que no puedes asistir");
      return;
    }
    startTransition(async () => {
      const result = await respondAttendance(
        academyId,
        game.gameId,
        response,
        comment.trim() || undefined
      );
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al responder");
      }
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {/* Info del juego */}
      <div>
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

      {/* Botones principales */}
      {!mode && (
        <div className="flex gap-3">
          <button
            onClick={() => setMode("accept")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Puedo asistir
          </button>
          <button
            onClick={() => setMode("reject")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            No puedo asistir
          </button>
        </div>
      )}

      {/* Modo aceptar */}
      {mode === "accept" && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              Comentario <span className="text-muted-foreground/70 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Llegaré 15 minutos antes..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-card resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleRespond("ACCEPTED")}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar asistencia
            </button>
            <button
              onClick={() => { setMode(null); setComment(""); setError(null); }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modo rechazar */}
      {mode === "reject" && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              Motivo <span className="text-red-500 text-xs">(obligatorio)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(null); }}
              placeholder="Ej: Tengo un compromiso familiar ese día..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-card resize-none"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleRespond("REJECTED")}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Confirmar rechazo
            </button>
            <button
              onClick={() => { setMode(null); setComment(""); setError(null); }}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingAttendanceList({ academyId, games }: Props) {
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
        <GameResponseCard key={game.assignmentId} game={game} academyId={academyId} />
      ))}
    </div>
  );
}
