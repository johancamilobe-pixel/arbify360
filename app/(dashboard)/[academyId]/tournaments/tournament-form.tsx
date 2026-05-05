"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTournament, updateTournament } from "@/actions/tournaments";
import { Plus, Loader2, X, Trophy } from "lucide-react";

interface Props {
  academyId:    string;
  mode:         "create" | "edit";
  tournamentId?: string;
  defaults?: {
    name:        string;
    description: string;
    startDate:   string;
    endDate:     string;
  };
  onSuccess?: () => void;
}

export function TournamentForm({ academyId, mode, tournamentId, defaults, onSuccess }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = mode === "edit" && tournamentId
        ? await updateTournament(academyId, tournamentId, formData)
        : await createTournament(academyId, formData);

      if (result.success) {
        setOpen(false);
        if (result.tournamentId && mode === "create") {
          router.push(`/${academyId}/tournaments/${result.tournamentId}`);
        } else {
          router.refresh();
          onSuccess?.();
        }
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  return (
    <>
      {mode === "create" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo torneo
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
        >
          Editar torneo
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-500" />
                <h2 className="font-semibold text-foreground">
                  {mode === "create" ? "Nuevo torneo" : "Editar torneo"}
                </h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground/80">Nombre del torneo</label>
                <input
                  name="name"
                  required
                  defaultValue={defaults?.name}
                  placeholder="Ej: Torneo Apertura 2026"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground/80">
                  Descripción <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={defaults?.description}
                  placeholder="Descripción del torneo..."
                  rows={2}
                  className={inputClass + " resize-none"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground/80">
                    Fecha inicio <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    defaultValue={defaults?.startDate}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground/80">
                    Fecha fin <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    defaultValue={defaults?.endDate}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted rounded-lg hover:bg-background transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? "Guardando..." : mode === "create" ? "Crear torneo" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass = "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
