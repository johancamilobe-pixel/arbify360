"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Phone, FileText } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

interface Referee {
  userId:       string;
  name:         string;
  photoUrl:     string | null;
  phone:        string | null;
  licenseNumber: string | null;
  categoryName: string | null;
  ratePerGame:  string | null;
  isActive:     boolean;
}

interface Props {
  academyId: string;
  referees:  Referee[];
}

export function RefereeSearch({ academyId, referees }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return referees;
    return referees.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.licenseNumber?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    );
  }, [query, referees]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, licencia o teléfono..."
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {query && (
        <p className="text-xs text-muted-foreground/70">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} para "${query}"`}
        </p>
      )}

      {/* Grid de árbitros */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground/70">
            No se encontraron árbitros con "{query}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Link
              key={r.userId}
              href={`/${academyId}/referees/${r.userId}`}
              className="bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              {/* Avatar + nombre */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-brand-600 font-bold text-sm">
                      {getInitials(r.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {highlight(r.name, query)}
                  </p>
                  {r.categoryName && (
                    <span className="text-xs text-brand-600 font-medium">
                      {r.categoryName}
                    </span>
                  )}
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-1.5">
                {r.licenseNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Licencia: {r.licenseNumber}</span>
                  </div>
                )}
                {r.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{r.phone}</span>
                  </div>
                )}
                {r.ratePerGame && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/70">Tarifa por juego</p>
                    <p className="text-brand-600 font-semibold text-sm">
                      {formatCurrency(r.ratePerGame)}
                    </p>
                  </div>
                )}
              </div>

              {!r.isActive && (
                <span className="mt-3 inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Inactivo
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Resalta el texto buscado dentro del nombre
function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-brand-100 text-brand-700 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
