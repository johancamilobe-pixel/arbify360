"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAvailabilityRange, deleteAvailability } from "@/actions/availability";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Trash2, Plus, Check } from "lucide-react";
import type { AvailabilitySlot } from "@/actions/availability";

interface Props {
  academyId:      string;
  userId:         string;
  existing:       AvailabilitySlot[];
  fromDate:       string; // YYYY-MM-DD
  toDate:         string;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function MyAvailability({ academyId, userId, existing, fromDate, toDate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Días seleccionados para agregar (YYYY-MM-DD)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [startTime, setStartTime]         = useState("07:00");
  const [endTime, setEndTime]             = useState("22:00");
  const [isAvailable, setIsAvailable]     = useState(true);
  const [notes, setNotes]                 = useState("");
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState(false);

  // Mapa de disponibilidad existente por fecha
  const existingMap = new Map(
    existing.map((s) => [s.date.toISOString().slice(0, 10), s])
  );

  // Generar días del rango seleccionado
  const days: Date[] = [];
  const cursor = new Date(fromDate + "T00:00:00");
  const end    = new Date(toDate + "T00:00:00");
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
    setSuccess(false);
    setError(null);
  }

  function handleSave() {
    if (selectedDates.size === 0) {
      setError("Selecciona al menos un día");
      return;
    }
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await saveAvailabilityRange(
        academyId,
        userId,
        Array.from(selectedDates),
        startTime,
        endTime,
        isAvailable,
        notes || undefined
      );

      if (result.success) {
        setSelectedDates(new Set());
        setNotes("");
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAvailability(academyId, id);
      router.refresh();
    });
  }

  // Agrupar días por semana para el calendario
  const weeks: Date[][] = [];
  let week: Date[] = [];
  // Rellenar días vacíos al inicio
  const firstDay = days[0]?.getDay() ?? 0;
  for (let i = 0; i < firstDay; i++) week.push(null as any);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null as any);
    weeks.push(week);
  }

  return (
    <div className="space-y-5">

      {/* Calendario de selección */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Selecciona los días</h3>
          {selectedDates.size > 0 && (
            <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2 py-1 rounded-full">
              {selectedDates.size} día{selectedDates.size !== 1 ? "s" : ""} seleccionado{selectedDates.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Encabezado de días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground/70 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Semanas */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const dateStr = day.toISOString().slice(0, 10);
                const hasSlot = existingMap.has(dateStr);
                const slot    = existingMap.get(dateStr);
                const isSelected = selectedDates.has(dateStr);
                const isPast  = day < new Date(new Date().toDateString());

                return (
                  <button
                    key={di}
                    onClick={() => !isPast && toggleDate(dateStr)}
                    disabled={isPast}
                    className={cn(
                      "relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
                      isPast && "opacity-30 cursor-not-allowed",
                      isSelected && "bg-brand-500 text-white ring-2 ring-brand-300",
                      !isSelected && hasSlot && slot?.isAvailable && "bg-green-100 text-green-700 hover:bg-green-200",
                      !isSelected && hasSlot && !slot?.isAvailable && "bg-red-100 text-red-700 hover:bg-red-200",
                      !isSelected && !hasSlot && !isPast && "hover:bg-muted text-foreground/80",
                    )}
                  >
                    <span>{day.getDate()}</span>
                    {hasSlot && !isSelected && (
                      <span className="text-[9px] leading-none mt-0.5 opacity-70">
                        {slot?.startTime}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
          <LegendItem color="bg-green-100 text-green-700" label="Disponible" />
          <LegendItem color="bg-red-100 text-red-700" label="No disponible" />
          <LegendItem color="bg-brand-500 text-white" label="Seleccionado" />
        </div>
      </div>

      {/* Configuración del horario */}
      {selectedDates.size > 0 && (
        <div className="bg-card rounded-xl border border-brand-200 p-5 space-y-4">
          <h3 className="font-semibold text-foreground">
            Configurar {selectedDates.size} día{selectedDates.size !== 1 ? "s" : ""}
          </h3>

          {/* Disponible / No disponible */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsAvailable(true)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                isAvailable
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-card text-muted-foreground border-border hover:border-green-300"
              )}
            >
              ✓ Disponible
            </button>
            <button
              onClick={() => setIsAvailable(false)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                !isAvailable
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-card text-muted-foreground border-border hover:border-red-300"
              )}
            >
              ✗ No disponible
            </button>
          </div>

          {/* Franja horaria */}
          {isAvailable && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Desde</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Hasta</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Nota <span className="text-muted-foreground/70 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Solo disponible en la tarde"
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              <Check className="w-4 h-4" />
              Disponibilidad guardada correctamente
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isPending ? "Guardando..." : "Guardar disponibilidad"}
          </button>
        </div>
      )}

      {/* Disponibilidad registrada */}
      {existing.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Mi disponibilidad registrada</h3>
          </div>
          <div className="divide-y divide-border/50">
            {existing.map((slot) => (
              <div key={slot.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {slot.date.toLocaleDateString("es-CO", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </p>
                  {slot.isAvailable ? (
                    <p className="text-xs text-green-600">
                      Disponible · {slot.startTime} – {slot.endTime}
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
                <button
                  onClick={() => handleDelete(slot.id)}
                  disabled={isPending}
                  className="p-1.5 text-muted-foreground/70 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {existing.length === 0 && selectedDates.size === 0 && (
        <div className="text-center py-8 text-muted-foreground/70 text-sm">
          Selecciona días en el calendario para registrar tu disponibilidad
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-3 h-3 rounded-sm", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
