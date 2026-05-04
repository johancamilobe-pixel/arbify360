"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondAttendance, checkInAttendance } from "@/actions/attendance";
import { Check, X, MapPin, Loader2, MessageSquare, Navigation, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Props {
  academyId:    string;
  gameId:       string;
  response:     "ACCEPTED" | "REJECTED" | null;
  comment:      string | null;
  checkedInAt:  string | null;
  latitude:     number | null;
  longitude:    number | null;
  gameStartTime: string; // ISO string
}

export function RefereeAttendancePanel({
  academyId,
  gameId,
  response,
  comment,
  checkedInAt,
  latitude,
  longitude,
  gameStartTime,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "accept" | "reject" | "change">(null);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  function handleRespond(res: "ACCEPTED" | "REJECTED") {
    setError(null);
    if (res === "REJECTED" && !newComment.trim()) {
      setError("Debes indicar el motivo por el que no puedes asistir");
      return;
    }
    startTransition(async () => {
      const result = await respondAttendance(academyId, gameId, res, newComment.trim() || undefined);
      if (result.success) {
        setMode(null);
        setNewComment("");
        router.refresh();
      } else {
        setError(result.error ?? "Error al responder");
      }
    });
  }

  function handleCheckIn() {
    setGpsLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          startTransition(async () => {
            const result = await checkInAttendance(
              academyId,
              gameId,
              pos.coords.latitude,
              pos.coords.longitude
            );
            setGpsLoading(false);
            if (result.success) router.refresh();
            else setError(result.error ?? "Error al registrar llegada");
          });
        },
        async () => {
          // Sin permiso GPS — registrar sin coordenadas
          startTransition(async () => {
            const result = await checkInAttendance(academyId, gameId);
            setGpsLoading(false);
            if (result.success) router.refresh();
            else setError(result.error ?? "Error al registrar llegada");
          });
        }
      );
    } else {
      // GPS no disponible
      startTransition(async () => {
        const result = await checkInAttendance(academyId, gameId);
        setGpsLoading(false);
        if (result.success) router.refresh();
        else setError(result.error ?? "Error al registrar llegada");
      });
    }
  }

  // ── Sin respuesta aún ──────────────────────────────────────────────────────
  if (!response) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">¿Puedes asistir?</h2>
        <p className="text-sm text-muted-foreground">
          Indica si puedes asistir a este juego para que el administrador lo sepa.
        </p>

        {!mode && (
          <div className="flex gap-3">
            <button onClick={() => setMode("accept")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              <Check className="w-4 h-4" /> Sí, puedo asistir
            </button>
            <button onClick={() => setMode("reject")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
              <X className="w-4 h-4" /> No puedo asistir
            </button>
          </div>
        )}

        {mode === "accept" && (
          <div className="space-y-3 border-t border-border/50 pt-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Comentario <span className="text-muted-foreground/70 font-normal text-xs">(opcional)</span>
              </label>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ej: Llegaré 15 minutos antes..." rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-card resize-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => handleRespond("ACCEPTED")} disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-70">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar
              </button>
              <button onClick={() => { setMode(null); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mode === "reject" && (
          <div className="space-y-3 border-t border-border/50 pt-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Motivo <span className="text-red-500 text-xs">(obligatorio)</span>
              </label>
              <textarea value={newComment} onChange={(e) => { setNewComment(e.target.value); setError(null); }}
                placeholder="Ej: Tengo un compromiso ese día..." rows={3} autoFocus
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-card resize-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => handleRespond("REJECTED")} disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-70">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Confirmar rechazo
              </button>
              <button onClick={() => { setMode(null); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Ya respondió ───────────────────────────────────────────────────────────
  const isAccepted = response === "ACCEPTED";

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h2 className="font-semibold text-foreground">Tu disponibilidad</h2>

      {/* Estado actual */}
      <div className={`flex items-start gap-3 p-3 rounded-lg ${isAccepted ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAccepted ? "bg-green-100" : "bg-red-100"}`}>
          {isAccepted ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}
        </div>
        <div>
          <p className={`text-sm font-semibold ${isAccepted ? "text-green-700" : "text-red-700"}`}>
            {isAccepted ? "Confirmaste tu asistencia" : "Rechazaste este juego"}
          </p>
          {comment && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
              <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {comment}
            </p>
          )}
        </div>
      </div>

      {/* Check-in GPS — solo si aceptó */}
      {isAccepted && (
        <div className="border-t border-border/50 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Registro de llegada</h3>

          {checkedInAt ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-green-700">
                ✓ Llegada registrada a las {formatTime(new Date(checkedInAt))}
              </p>
              {latitude && longitude && (
                <a href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                  <MapPin className="w-3 h-3" /> Ver ubicación en Maps
                </a>
              )}
              {!latitude && (
                <p className="text-xs text-muted-foreground/70">Sin coordenadas GPS</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Cuando llegues al juego, registra tu llegada para que el admin lo vea.
              </p>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleCheckIn} disabled={isPending || gpsLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70 w-full justify-center">
                {(isPending || gpsLoading)
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Navigation className="w-4 h-4" />}
                {(isPending || gpsLoading) ? "Registrando..." : "Registrar mi llegada"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cambiar respuesta */}
      {!mode && (
        <button onClick={() => { setMode("change"); setNewComment(comment ?? ""); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Cambiar mi respuesta
        </button>
      )}

      {mode === "change" && (
        <div className="border-t border-border/50 pt-3 space-y-3">
          <p className="text-sm font-medium text-foreground">Cambiar disponibilidad</p>
          <div className="flex gap-3">
            <button onClick={() => handleRespond("ACCEPTED")} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-70">
              <Check className="w-4 h-4" /> Sí puedo
            </button>
            <button onClick={() => setMode("reject_change")} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-70">
              <X className="w-4 h-4" /> No puedo
            </button>
          </div>
          <button onClick={() => { setMode(null); setError(null); }}
            className="text-xs text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        </div>
      )}

      {mode === "reject_change" && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Motivo <span className="text-red-500 text-xs">(obligatorio)</span>
            </label>
            <textarea value={newComment} onChange={(e) => { setNewComment(e.target.value); setError(null); }}
              placeholder="Ej: Tengo un compromiso ese día..." rows={2} autoFocus
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-card resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => handleRespond("REJECTED")} disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg disabled:opacity-70">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Confirmar
            </button>
            <button onClick={() => { setMode(null); setError(null); }}
              className="px-4 py-2 text-sm text-foreground/80 bg-muted rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
