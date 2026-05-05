"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTournamentStatus, deleteTournament } from "@/actions/tournaments";
import { CheckCircle2, Loader2, Trash2, MoreVertical, RotateCcw } from "lucide-react";

interface Props {
  academyId:     string;
  tournamentId:  string;
  currentStatus: "ACTIVE" | "FINISHED";
}

export function TournamentActions({ academyId, tournamentId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleStatusChange() {
    const newStatus = currentStatus === "ACTIVE" ? "FINISHED" : "ACTIVE";
    startTransition(async () => {
      await updateTournamentStatus(academyId, tournamentId, newStatus);
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTournament(academyId, tournamentId);
      if (result.success) {
        router.push(`/${academyId}/tournaments`);
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-lg shadow-lg w-48 overflow-hidden">
            <button
              onClick={handleStatusChange}
              disabled={isPending}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStatus === "ACTIVE" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <RotateCcw className="w-4 h-4 text-brand-500" />
              )}
              {currentStatus === "ACTIVE" ? "Marcar finalizado" : "Reactivar torneo"}
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border/50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar torneo
              </button>
            ) : (
              <div className="border-t border-border/50 p-3 space-y-2">
                <p className="text-xs text-red-600 font-medium">¿Eliminar este torneo?</p>
                <p className="text-xs text-muted-foreground">Los juegos no se eliminarán.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-70"
                  >
                    {isPending ? "..." : "Sí, eliminar"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-foreground/80 bg-muted rounded-md"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
