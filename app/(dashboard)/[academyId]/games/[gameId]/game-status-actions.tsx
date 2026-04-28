"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGameStatus } from "@/actions/games";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  academyId: string;
  gameId: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { label: string; next: any; color: string }[]> = {
  SCHEDULED: [
    { label: "Confirmar juego", next: "CONFIRMED", color: "bg-green-500 hover:bg-green-600 text-white" },
    { label: "Cancelar juego",  next: "CANCELLED", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  CONFIRMED: [
    { label: "Marcar finalizado", next: "FINISHED",   color: "bg-brand-500 hover:bg-brand-600 text-white" },
    { label: "Cancelar juego",    next: "CANCELLED",  color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  FINISHED:  [],
  CANCELLED: [
    { label: "Reprogramar", next: "SCHEDULED", color: "bg-muted hover:bg-muted text-foreground/80" },
  ],
};

export function GameStatusActions({ academyId, gameId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  function handleAction(next: any) {
    startTransition(async () => {
      await updateGameStatus(academyId, gameId, next);
      router.refresh();
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="font-semibold text-foreground mb-4">Acciones</h2>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.next}
            onClick={() => handleAction(action.next)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70",
              action.color
            )}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
