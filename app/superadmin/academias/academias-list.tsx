"use client";

import { useState } from "react";
import { toggleAcademyStatus } from "@/actions/superadmin";
import { Building2, Users, Calendar, Power } from "lucide-react";

interface Academy {
  id:        string;
  name:      string;
  logoUrl:   string | null;
  isActive:  boolean;
  createdAt: string;
  members:   number;
  games:     number;
  subStatus: string;
}

interface Props {
  academies: Academy[];
}

export function AcademiasList({ academies: initial }: Props) {
  const [academies, setAcademies] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, currentStatus: boolean) {
    setLoadingId(id);
    const result = await toggleAcademyStatus(id, !currentStatus);
    if (result.success) {
      setAcademies((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a))
      );
    }
    setLoadingId(null);
  }

  return (
    <div className="space-y-3">
      {academies.map((a) => (
        <div key={a.id} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          {/* Logo o iniciales */}
          <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
            {a.logoUrl ? (
              <img src={a.logoUrl} alt={a.name} className="w-full h-full object-cover" />
            ) : (
              a.name[0]
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{a.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {a.members} miembros
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {a.games} juegos
              </span>
              <span className="text-xs text-muted-foreground">
                Creada: {new Date(a.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Estado */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {a.isActive ? "Activa" : "Inactiva"}
          </span>

          {/* Toggle */}
          <button
            onClick={() => handleToggle(a.id, a.isActive)}
            disabled={loadingId === a.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0 ${
              a.isActive
                ? "border border-red-200 text-red-600 hover:bg-red-50"
                : "border border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {a.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      ))}
    </div>
  );
}
