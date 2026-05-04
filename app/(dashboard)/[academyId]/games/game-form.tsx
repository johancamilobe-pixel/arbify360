"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGame, updateGame } from "@/actions/games";
import { AlertTriangle, Loader2, CheckCircle2, Search, X, ChevronDown } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";

interface Sport    { id: string; name: string }
interface Category { id: string; name: string; incomePerGame?: any }
interface Phase    { id: string; name: string }
interface Referee  { id: string; name: string; email?: string; category: string | null; licenseNumber: string | null }

// Defaults para modo edición
interface GameDefaults {
  homeTeam:            string;
  awayTeam:            string;
  venue:               string;
  sportId:             string;
  gameCategoryId:      string;
  gamePhaseId?:        string;
  startTime:           string; // "YYYY-MM-DDTHH:MM"
  endTime:             string;
  mainRefereeId?:      string;
  secondaryRefereeId?: string;
  tableAssistantId?:   string;
}

interface Props {
  academyId:  string;
  sports:     Sport[];
  categories: Category[];
  phases:     Phase[];
  referees:   Referee[];
  mode?:      "create" | "edit";
  gameId?:    string;
  defaults?:  GameDefaults;
}

export function GameForm({
  academyId,
  sports,
  categories,
  phases,
  referees,
  mode = "create",
  gameId,
  defaults,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const [conflicts, setConflicts]    = useState<any[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Track si hay al menos un árbitro seleccionado para mostrar aviso de auto-confirmación
  const [hasReferee, setHasReferee] = useState(
    !!(defaults?.mainRefereeId || defaults?.secondaryRefereeId || defaults?.tableAssistantId)
  );

  function handleRefereeChange() {
    // Verificar si hay al menos un árbitro seleccionado
    const form = document.querySelector("form") as HTMLFormElement | null;
    if (!form) return;
    const formData = new FormData(form);
    const hasAny = !!(
      formData.get("mainRefereeId") ||
      formData.get("secondaryRefereeId") ||
      formData.get("tableAssistantId")
    );
    setHasReferee(hasAny);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setConflicts([]);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result =
        mode === "edit" && gameId
          ? await updateGame(academyId, gameId, formData)
          : await createGame(academyId, formData);

      if (result.success && result.gameId) {
        router.push(`/${academyId}/games/${result.gameId}`);
        router.refresh();
        return;
      }

      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        return;
      }

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        return;
      }

      setError(result.error ?? "Error al guardar el juego");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Alerta de conflictos */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
            <AlertTriangle className="w-5 h-5" />
            Conflicto de horario detectado
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="text-sm text-red-600 mb-1">
              <strong>{c.userName}</strong> ya está asignado en{" "}
              <strong>{c.conflictingAcademyName}</strong> — {c.conflictingVenue} de{" "}
              {formatTime(new Date(c.startTime))} a {formatTime(new Date(c.endTime))}
            </div>
          ))}
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Card: Información del juego */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Información del juego</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Equipo local" error={fieldErrors.homeTeam?.[0]}>
            <input
              name="homeTeam"
              placeholder="Ej: Águilas FC"
              defaultValue={defaults?.homeTeam}
              className={inputClass}
            />
          </Field>
          <Field label="Equipo visitante" error={fieldErrors.awayTeam?.[0]}>
            <input
              name="awayTeam"
              placeholder="Ej: Tigres BC"
              defaultValue={defaults?.awayTeam}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Lugar / Escenario" error={fieldErrors.venue?.[0]}>
          <input
            name="venue"
            placeholder="Ej: Coliseo El Salitre"
            defaultValue={defaults?.venue}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Deporte" error={fieldErrors.sportId?.[0]}>
            <select name="sportId" className={inputClass} defaultValue={defaults?.sportId ?? ""}>
              <option value="" disabled>Selecciona...</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" error={fieldErrors.gameCategoryId?.[0]}>
            <select name="gameCategoryId" className={inputClass} defaultValue={defaults?.gameCategoryId ?? ""}>
              <option value="" disabled>Selecciona...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Fase del torneo">
          <select name="gamePhaseId" className={inputClass} defaultValue={defaults?.gamePhaseId ?? ""}>
            <option value="">Sin fase asignada</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Inicio" error={fieldErrors.startTime?.[0]}>
            <input
              name="startTime"
              type="datetime-local"
              defaultValue={defaults?.startTime}
              className={inputClass}
            />
          </Field>
          <Field label="Fin" error={fieldErrors.endTime?.[0]}>
            <input
              name="endTime"
              type="datetime-local"
              defaultValue={defaults?.endTime}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Card: Árbitros */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Asignación de árbitros</h2>
        <p className="text-sm text-muted-foreground">
          Al asignar árbitros, el juego se confirma automáticamente. Si hay conflicto de horario, se notificará al guardar.
        </p>

        {/* Aviso de auto-confirmación */}
        {hasReferee && (
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Al guardar, el juego quedará <strong>confirmado</strong> automáticamente con los árbitros seleccionados.
            </span>
          </div>
        )}

        {referees.length === 0 ? (
          <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            No hay árbitros registrados en esta academia aún.
          </p>
        ) : (
          <div className="space-y-4">
            <RefereeSelect
              name="mainRefereeId"
              label="Árbitro principal"
              referees={referees}
              defaultValue={defaults?.mainRefereeId}
              onChange={handleRefereeChange}
            />
            <RefereeSelect
              name="secondaryRefereeId"
              label="Árbitro secundario"
              referees={referees}
              defaultValue={defaults?.secondaryRefereeId}
              onChange={handleRefereeChange}
            />
            <RefereeSelect
              name="tableAssistantId"
              label="Asistente de mesa"
              referees={referees}
              defaultValue={defaults?.tableAssistantId}
              onChange={handleRefereeChange}
            />
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-background transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending
            ? "Guardando..."
            : mode === "edit"
            ? "Guardar cambios"
            : "Crear juego"}
        </button>
      </div>
    </form>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function RefereeSelect({
  name,
  label,
  referees,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  referees: { id: string; name: string; email?: string; category: string | null; licenseNumber: string | null }[];
  defaultValue?: string;
  onChange?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");

  const selected = referees.find((r) => r.id === selectedId);

  const filtered = query.trim()
    ? referees.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.email?.toLowerCase().includes(query.toLowerCase()) ||
        r.licenseNumber?.toLowerCase().includes(query.toLowerCase())
      )
    : referees;

  function handleSelect(id: string) {
    setSelectedId(id);
    setQuery("");
    setOpen(false);
    onChange?.();
  }

  function handleClear() {
    setSelectedId("");
    setQuery("");
    setOpen(false);
    onChange?.();
  }

  return (
    <Field label={label}>
      {/* Hidden input para el form */}
      <input type="hidden" name={name} value={selectedId} />

      <div className="relative">
        {/* Input de búsqueda / árbitro seleccionado */}
        <div
          className={cn(
            "w-full px-3 py-2 text-sm border border-border rounded-lg bg-card flex items-center gap-2 cursor-pointer",
            open && "ring-2 ring-brand-400 border-transparent"
          )}
          onClick={() => { setOpen(!open); setQuery(""); }}
        >
          {selected ? (
            <>
              <span className="flex-1 truncate text-foreground">{selected.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="text-muted-foreground/70 hover:text-foreground flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <span className="text-muted-foreground/60 flex-1">Sin asignar</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            </>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-xl overflow-hidden">
            {/* Input búsqueda */}
            <div className="p-2 border-b border-zinc-200 dark:border-zinc-600">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-500 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder:text-zinc-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Opciones */}
            <div className="max-h-48 overflow-y-auto">
              {/* Opción vacía */}
              <button
                type="button"
                onClick={() => handleClear()}
                className="w-full text-left px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                Sin asignar
              </button>

              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-400">Sin resultados</p>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
                      r.id === selectedId && "bg-brand-50 dark:bg-brand-900/30"
                    )}
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{r.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {r.email && <span>{r.email}</span>}
                      {r.category && <span> · {r.category}</span>}
                      {r.licenseNumber && <span> · {r.licenseNumber}</span>}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";