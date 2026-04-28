"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGame, updateGame } from "@/actions/games";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Sport    { id: string; name: string }
interface Category { id: string; name: string; incomePerGame?: any }
interface Referee  { id: string; name: string; category: string | null; licenseNumber: string | null }

// Defaults para modo edición
interface GameDefaults {
  homeTeam:            string;
  awayTeam:            string;
  venue:               string;
  sportId:             string;
  gameCategoryId:      string;
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
  referees:   Referee[];
  mode?:      "create" | "edit";
  gameId?:    string;
  defaults?:  GameDefaults;
}

export function GameForm({
  academyId,
  sports,
  categories,
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
          El sistema verificará conflictos de horario automáticamente al guardar.
        </p>

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
            />
            <RefereeSelect
              name="secondaryRefereeId"
              label="Árbitro secundario"
              referees={referees}
              defaultValue={defaults?.secondaryRefereeId}
            />
            <RefereeSelect
              name="tableAssistantId"
              label="Asistente de mesa"
              referees={referees}
              defaultValue={defaults?.tableAssistantId}
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
}: {
  name: string;
  label: string;
  referees: { id: string; name: string; category: string | null; licenseNumber: string | null }[];
  defaultValue?: string;
}) {
  return (
    <Field label={label}>
      <select name={name} className={inputClass} defaultValue={defaultValue ?? ""}>
        <option value="">Sin asignar</option>
        {referees.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
            {r.category ? ` · ${r.category}` : ""}
            {r.licenseNumber ? ` (${r.licenseNumber})` : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
