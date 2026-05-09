"use client";

import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface Props {
  profile: {
    role:         string;
    categoryName: string | null;
    ratePerGame:  string | null;
    totalGames:   number;
    totalEarned:  string;
    memberSince:  string;
    firstName:    string;
    lastName:     string;
    photoUrl:     string | null;
    userId:       string;
    academyId:    string;
  };
}

export function ProfileInfoCard({ profile }: Props) {
  const isAdmin = profile.role === "ADMIN";
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = getInitials(fullName || "U");

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">

      {/* Avatar + nombre */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={fullName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold border-2 border-border">
              {initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {fullName || "Sin nombre"}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Miembro desde {profile.memberSince}
          </p>
        </div>
      </div>

      {/* Estadísticas solo para árbitros */}
      {!isAdmin && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
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
