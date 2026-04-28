"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "@/actions/availability";

interface Props {
  slots:   AvailabilitySlot[];
  fromDate: string;
  toDate:   string;
}

// Paleta de colores para diferenciar árbitros
const REFEREE_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

const DAYS_ES  = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function AvailabilityCalendar({ slots, fromDate, toDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Asignar color por árbitro
  const userIds = [...new Set(slots.map((s) => s.userId))];
  const colorMap = new Map(userIds.map((id, i) => [id, REFEREE_COLORS[i % REFEREE_COLORS.length]]));

  // Agrupar slots por fecha
  const slotsByDate = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = slot.date.toISOString().slice(0, 10);
    if (!slotsByDate.has(key)) slotsByDate.set(key, []);
    slotsByDate.get(key)!.push(slot);
  }

  // Generar días del rango
  const days: Date[] = [];
  const cursor = new Date(fromDate + "T00:00:00");
  const end    = new Date(toDate + "T00:00:00");
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Agrupar en semanas
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  const firstDay = days[0]?.getDay() ?? 0;
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const selectedSlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Calendario */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground/70 py-1">{d}</div>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const dateStr   = day.toISOString().slice(0, 10);
                const daySlots  = slotsByDate.get(dateStr) ?? [];
                const available = daySlots.filter((s) => s.isAvailable);
                const isSelected = selectedDate === dateStr;
                const isToday   = dateStr === new Date().toISOString().slice(0, 10);

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      "relative min-h-[56px] rounded-lg p-1.5 text-left transition-all border",
                      isSelected ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300" : "border-transparent hover:border-border hover:bg-background",
                      isToday && !isSelected && "border-brand-200"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-medium block mb-1",
                      isToday ? "text-brand-600" : "text-foreground/80"
                    )}>
                      {day.getDate()}
                    </span>
                    {/* Indicadores de árbitros */}
                    <div className="flex flex-wrap gap-0.5">
                      {available.slice(0, 3).map((slot) => (
                        <div
                          key={slot.userId}
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            colorMap.get(slot.userId)?.split(" ")[0] ?? "bg-gray-300"
                          )}
                          title={slot.userName}
                        />
                      ))}
                      {available.length > 3 && (
                        <span className="text-[9px] text-muted-foreground/70">+{available.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Leyenda de árbitros */}
        {userIds.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
            {userIds.map((uid) => {
              const name  = slots.find((s) => s.userId === uid)?.userName ?? uid;
              const color = colorMap.get(uid)?.split(" ")[0] ?? "bg-gray-300";
              return (
                <div key={uid} className="flex items-center gap-1.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDate && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 bg-background">
            <h3 className="font-semibold text-foreground text-sm">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-CO", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {selectedSlots.filter((s) => s.isAvailable).length} árbitro{selectedSlots.filter((s) => s.isAvailable).length !== 1 ? "s" : ""} disponible{selectedSlots.filter((s) => s.isAvailable).length !== 1 ? "s" : ""}
            </p>
          </div>
          {selectedSlots.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground/70">Ningún árbitro registró disponibilidad este día</p>
          ) : (
            <div className="divide-y divide-border/50">
              {selectedSlots.map((slot) => (
                <div key={slot.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    slot.isAvailable ? colorMap.get(slot.userId)?.split(" ")[0] : "bg-red-300"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{slot.userName}</p>
                    {slot.isAvailable ? (
                      <p className="text-xs text-muted-foreground">
                        {slot.startTime} – {slot.endTime}
                        {slot.notes && ` · ${slot.notes}`}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500">No disponible{slot.notes && ` · ${slot.notes}`}</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                    slot.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  )}>
                    {slot.isAvailable ? "Disponible" : "No disponible"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
