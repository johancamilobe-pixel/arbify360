"use client";

import { Check, X, Clock, MapPin, Navigation, MessageSquare } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { GAME_ROLE_LABELS } from "@/lib/utils";

interface AssignmentAttendance {
  assignmentId: string;
  userId:       string;
  userName:     string;
  role:         string;
  response:     "ACCEPTED" | "REJECTED" | null;
  comment:      string | null;
  confirmedAt:  string | null;
  checkedInAt:  string | null;
  latitude:     number | null;
  longitude:    number | null;
}

interface Props {
  assignments: AssignmentAttendance[];
  gameStartTime: string;
}

export function AdminAttendancePanel({ assignments, gameStartTime }: Props) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground/70">Sin árbitros asignados</p>
      </div>
    );
  }

  const gameStart = new Date(gameStartTime);

  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const checkedInDate = a.checkedInAt ? new Date(a.checkedInAt) : null;
        const arrivedOnTime = checkedInDate ? checkedInDate <= gameStart : null;

        return (
          <div key={a.assignmentId} className="border border-border/50 rounded-lg p-3 space-y-2">
            {/* Árbitro + rol */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{a.userName}</p>
                <p className="text-xs text-muted-foreground">{GAME_ROLE_LABELS[a.role] ?? a.role}</p>
              </div>

              {/* Badge respuesta */}
              {a.response === "ACCEPTED" && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" /> Confirmó
                </span>
              )}
              {a.response === "REJECTED" && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  <X className="w-3 h-3" /> Rechazó
                </span>
              )}
              {!a.response && (
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> Sin respuesta
                </span>
              )}
            </div>

            {/* Comentario */}
            {a.comment && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-2">
                <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{a.comment}</span>
              </div>
            )}

            {/* Check-in GPS */}
            {a.response === "ACCEPTED" && (
              <div className="border-t border-border/30 pt-2">
                {checkedInDate ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-brand-500" />
                      <span className="text-xs text-foreground font-medium">
                        Llegó a las {formatTime(checkedInDate)}
                      </span>
                      {arrivedOnTime !== null && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                          arrivedOnTime
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {arrivedOnTime ? "A tiempo" : "Tarde"}
                        </span>
                      )}
                    </div>
                    {a.latitude && a.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                      >
                        <MapPin className="w-3 h-3" /> GPS
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Aún no ha registrado llegada
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
