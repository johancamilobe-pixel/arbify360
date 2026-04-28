"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAttendance, cancelAttendance } from "@/actions/attendance";
import { Check, X, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  academyId:   string;
  gameId:      string;
  confirmed:   boolean;
  confirmedAt: string | null;
  gameStatus:  string;
}

export function AttendanceButton({ academyId, gameId, confirmed, confirmedAt, gameStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]    = useState<string | null>(null);
  const [useGps, setUseGps]  = useState(false);

  const canConfirm = ["SCHEDULED", "CONFIRMED"].includes(gameStatus);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      let lat: number | undefined;
      let lng: number | undefined;

      if (useGps && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // GPS falló — continuar sin ubicación
        }
      }

      const result = await confirmAttendance(academyId, gameId, lat, lng);
      if (!result.success) {
        setError(result.error ?? "Error al confirmar");
      } else {
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAttendance(academyId, gameId);
      if (!result.success) {
        setError(result.error ?? "Error al cancelar");
      } else {
        router.refresh();
      }
    });
  }

  if (!canConfirm && !confirmed) return null;

  return (
    <div className="space-y-3">
      {confirmed ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Asistencia confirmada</span>
          </div>
          {confirmedAt && (
            <p className="text-xs text-green-600 mt-1 ml-7">{confirmedAt}</p>
          )}
          {canConfirm && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="mt-3 ml-7 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Cancelar confirmación
            </button>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-yellow-800 font-medium">
            Confirma tu asistencia a este juego
          </p>

          {/* Opción GPS */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useGps}
              onChange={(e) => setUseGps(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Enviar mi ubicación
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isPending ? "Confirmando..." : "Confirmar asistencia"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}
