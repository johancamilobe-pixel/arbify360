"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelAttendance } from "@/actions/attendance";
import { Check, X, MapPin, Loader2 } from "lucide-react";
import { cn, GAME_ROLE_LABELS } from "@/lib/utils";

interface AttendanceInfo {
  assignmentId: string;
  userId:       string;
  userName:     string;
  userPhoto:    string | null;
  role:         string;
  confirmed:    boolean;
  confirmedAt:  string | null;
  latitude:     number | null;
  longitude:    number | null;
}

interface Props {
  academyId:  string;
  gameId:     string;
  gameStatus: string;
  attendance: AttendanceInfo[];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function AttendancePanel({ academyId, gameId, gameStatus, attendance }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canModify = ["SCHEDULED", "CONFIRMED"].includes(gameStatus);

  const confirmed = attendance.filter((a) => a.confirmed).length;
  const total     = attendance.length;

  function handleCancelFor(userId: string) {
    startTransition(async () => {
      await cancelAttendance(academyId, gameId, userId);
      router.refresh();
    });
  }

  if (total === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Confirmación de asistencia</h3>
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          confirmed === total
            ? "bg-green-100 text-green-700"
            : confirmed > 0
            ? "bg-yellow-100 text-yellow-700"
            : "bg-muted text-muted-foreground"
        )}>
          {confirmed}/{total} confirmados
        </span>
      </div>

      <div className="space-y-2">
        {attendance.map((a) => (
          <div key={a.assignmentId} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {a.userPhoto ? (
                <img src={a.userPhoto} alt={a.userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand-600 font-bold text-xs">
                  {getInitials(a.userName)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{a.userName}</p>
              <p className="text-xs text-muted-foreground/70">{GAME_ROLE_LABELS[a.role] ?? a.role}</p>
            </div>

            {/* Estado */}
            {a.confirmed ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Confirmado</span>
                  </div>
                  {a.confirmedAt && (
                    <p className="text-xs text-muted-foreground/70">{a.confirmedAt}</p>
                  )}
                  {a.latitude && a.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-xs text-brand-500 hover:underline"
                    >
                      <MapPin className="w-3 h-3" />
                      Ver ubicación
                    </a>
                  )}
                </div>
                {canModify && (
                  <button
                    onClick={() => handleCancelFor(a.userId)}
                    disabled={isPending}
                    className="p-1 text-muted-foreground/50 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Cancelar confirmación"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/70 bg-background px-2 py-1 rounded-full">
                Pendiente
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
