"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGame } from "@/actions/games";
import { GameForm } from "../game-form";
import { Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react";

interface Sport    { id: string; name: string }
interface Category { id: string; name: string; incomePerGame?: any }
interface Phase    { id: string; name: string }
interface Referee  { id: string; name: string; category: string | null; licenseNumber: string | null }

interface GameDefaults {
  homeTeam:            string;
  awayTeam:            string;
  venue:               string;
  sportId:             string;
  gameCategoryId:      string;
  gamePhaseId?:        string;
  startTime:           string;
  endTime:             string;
  mainRefereeId?:      string;
  secondaryRefereeId?: string;
  tableAssistantId?:   string;
}

interface Props {
  academyId:  string;
  gameId:     string;
  sports:     Sport[];
  categories: Category[];
  phases:     Phase[];
  referees:   Referee[];
  defaults:   GameDefaults;
}

export function GameEditPanel({
  academyId,
  gameId,
  sports,
  categories,
  phases,
  referees,
  defaults,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteGame(academyId, gameId);
      if (result.success) {
        router.push(`/${academyId}/games`);
      } else {
        setDeleteError(result.error ?? "Error al eliminar");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h2 className="font-semibold text-foreground">Gestión del juego</h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setShowEdit(!showEdit); setShowDeleteConfirm(false); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {showEdit ? "Cancelar edición" : "Editar juego"}
        </button>

        <button
          onClick={() => { setShowDeleteConfirm(true); setShowEdit(false); }}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-70"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar juego
        </button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-500">{deleteError}</p>
      )}

      {showDeleteConfirm && (
        <div className="border-t border-border/50 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  ¿Eliminar este juego?
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Se eliminarán también todas las planillas y datos asociados. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-70"
                  >
                    {isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                    {isPending ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="border-t border-border/50 pt-4">
          <GameForm
            academyId={academyId}
            gameId={gameId}
            mode="edit"
            sports={sports}
            categories={categories}
            phases={phases}
            referees={referees}
            defaults={defaults}
          />
        </div>
      )}
    </div>
  );
}
