"use client";

import { cn } from "@/lib/utils";

interface Props {
  profile: {
    role:         string;
    categoryName: string | null;
    ratePerGame:  string | null;
    totalGames:   number;
    totalEarned:  string;
    memberSince:  string;
  };
}

export function ProfileInfoCard({ profile }: Props) {
  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {/* Rol y categoría */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          isAdmin ? "bg-brand-100 text-brand-700" : "bg-blue-100 text-blue-700"
        )}>
          {isAdmin ? "Administrador" : "Árbitro"}
        </span>
        {profile.categoryName && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {profile.categoryName}
          </span>
        )}
        <span className="text-xs text-muted-foreground/70">
          Miembro desde {profile.memberSince}
        </span>
      </div>

      {/* Estadísticas solo para árbitros */}
      {!isAdmin && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{profile.totalGames}</p>
            <p className="text-xs text-muted-foreground/70">Juegos</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{profile.totalEarned}</p>
            <p className="text-xs text-muted-foreground/70">Total ganado</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-brand-600">{profile.ratePerGame ?? "—"}</p>
            <p className="text-xs text-muted-foreground/70">Tarifa/juego</p>
          </div>
        </div>
      )}
    </div>
  );
}
