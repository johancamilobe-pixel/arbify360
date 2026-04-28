"use client";

import { useTransition, useState } from "react";
import { toggleSport } from "@/actions/settings";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sport {
  id:     string;
  name:   string;
  active: boolean;
}

interface Props {
  academyId: string;
  sports:    Sport[];
}

export function SportsToggle({ academyId, sports }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const [loadingId, setLoadingId]    = useState<string | null>(null);

  function handleToggle(sportId: string, active: boolean) {
    setError(null);
    setLoadingId(sportId);
    startTransition(async () => {
      const result = await toggleSport(academyId, sportId, active);
      if (!result.success) setError(result.error ?? "Error al actualizar");
      setLoadingId(null);
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => handleToggle(sport.id, !sport.active)}
            disabled={isPending}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
              sport.active
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-card border-border text-muted-foreground hover:border-gray-300"
            )}
          >
            <span>{sport.name}</span>
            {loadingId === sport.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            ) : (
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors flex-shrink-0 relative",
                sport.active ? "bg-brand-500" : "bg-muted"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-card rounded-full shadow transition-transform",
                  sport.active ? "translate-x-4" : "translate-x-0.5"
                )} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
