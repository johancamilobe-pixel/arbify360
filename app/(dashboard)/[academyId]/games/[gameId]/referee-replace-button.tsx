"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replaceReferee } from "@/actions/games";
import { RefreshCw, Loader2, AlertTriangle, X, Check } from "lucide-react";

interface Referee {
  id: string;
  name: string;
  category: string | null;
  licenseNumber: string | null;
}

interface Props {
  academyId: string;
  gameId: string;
  assignmentId: string;
  currentUserId: string;
  currentUserName: string;
  role: string;
  referees: Referee[];
  hasApprovedSubmission: boolean;
}

export function RefereeReplaceButton({
  academyId,
  gameId,
  assignmentId,
  currentUserId,
  currentUserName,
  role,
  referees,
  hasApprovedSubmission,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSelector, setShowSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  // Filtrar árbitros disponibles (excluir el actual)
  const availableReferees = referees.filter((r) => r.id !== currentUserId);

  function handleReplace() {
    if (!selectedId) return;
    setError(null);

    startTransition(async () => {
      const result = await replaceReferee(academyId, gameId, assignmentId, selectedId);

      if (result.success) {
        setShowSelector(false);
        setSelectedId("");
        router.refresh();
      } else {
        setError(result.error ?? "Error al reemplazar árbitro");
      }
    });
  }

  // No mostrar botón si tiene planilla aprobada
  if (hasApprovedSubmission) {
    return null;
  }

  return (
    <div className="relative">
      {!showSelector ? (
        <button
          onClick={() => { setShowSelector(true); setError(null); }}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
          title={`Cambiar árbitro: ${currentUserName}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Cambiar árbitro
        </button>
      ) : (
        <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Reemplazar a <strong className="text-foreground">{currentUserName}</strong>
            </p>
            <button
              onClick={() => { setShowSelector(false); setError(null); setSelectedId(""); }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {availableReferees.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay otros árbitros disponibles en esta academia.
            </p>
          ) : (
            <>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card"
              >
                <option value="">Seleccionar árbitro...</option>
                {availableReferees.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.category ? ` · ${r.category}` : ""}
                    {r.licenseNumber ? ` (${r.licenseNumber})` : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleReplace}
                  disabled={!selectedId || isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {isPending ? "Reemplazando..." : "Confirmar"}
                </button>
                <button
                  onClick={() => { setShowSelector(false); setError(null); setSelectedId(""); }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
