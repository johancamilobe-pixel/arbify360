"use client";

import { useState, useTransition } from "react";
import { getAvailableReferees } from "@/actions/availability";
import { cn } from "@/lib/utils";
import { Loader2, Search, Users } from "lucide-react";

interface Props {
  academyId: string;
}

interface AvailableReferee {
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  notes: string | null;
}

export function AvailabilityFilter({ academyId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate]           = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime]     = useState("12:00");
  const [results, setResults]     = useState<AvailableReferee[] | null>(null);
  const [searched, setSearched]   = useState(false);

  function handleSearch() {
    if (!date) return;

    startTransition(async () => {
      const available = await getAvailableReferees(academyId, date, startTime, endTime);
      setResults(available);
      setSearched(true);
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">¿Quién está disponible?</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Busca árbitros disponibles en una fecha y horario específico.
      </p>

      {/* Campos de búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSearched(false); }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setSearched(false); }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); setSearched(false); }}
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={isPending || !date}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {isPending ? "Buscando..." : "Buscar disponibles"}
      </button>

      {/* Resultados */}
      {searched && results !== null && (
        <div className="pt-4 border-t border-border/50">
          {results.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/70">
                Ningún árbitro registró disponibilidad para ese horario
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {results.length} árbitro{results.length !== 1 ? "s" : ""} disponible{results.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {results.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.userName}</p>
                      <p className="text-xs text-green-600">
                        {r.startTime} – {r.endTime}
                        {r.notes && ` · ${r.notes}`}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Disponible
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
