"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Calendar, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Game {
  id:           string;
  homeTeam:     string;
  awayTeam:     string;
  sport:        string;
  category:     string;
  venue:        string;
  date:         string;
  time:         string;
  status:       string;
  statusLabel:  string;
  statusColor:  string;
  referees:     string[];
  noReferees:   boolean;
}

interface Props {
  academyId: string;
  games:     Game[];
  isAdmin:   boolean;
}

export function GamesSearch({ academyId, games, isAdmin }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return games;
    return games.filter((g) =>
      g.homeTeam.toLowerCase().includes(q)  ||
      g.awayTeam.toLowerCase().includes(q)  ||
      g.venue.toLowerCase().includes(q)     ||
      g.sport.toLowerCase().includes(q)     ||
      g.category.toLowerCase().includes(q)  ||
      g.referees.some((r) => r.toLowerCase().includes(q))
    );
  }, [query, games]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por equipo, sede, deporte o árbitro..."
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

      {/* Contador */}
      {query && (
        <p className="text-xs text-muted-foreground/70">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} juego${filtered.length !== 1 ? "s" : ""} para "${query}"`}
        </p>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground/70">
            No se encontraron juegos con "{query}"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((game) => (
            <Link
              key={game.id}
              href={`/${academyId}/games/${game.id}`}
              className="block bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Equipos */}
                  <p className="font-bold text-foreground text-lg">
                    {highlightTeam(game.homeTeam, query)}{" "}
                    <span className="text-muted-foreground/70 font-normal text-base">vs</span>{" "}
                    {highlightTeam(game.awayTeam, query)}
                  </p>

                  {/* Deporte + categoría */}
                  <p className="text-sm text-brand-600 font-medium mt-0.5">
                    {game.sport} · {game.category}
                  </p>

                  {/* Fecha y lugar */}
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {game.date} · {game.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {game.venue}
                    </span>
                  </div>

                  {/* Árbitros */}
                  {game.referees.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span className="text-sm text-muted-foreground">
                        {game.referees.join(", ")}
                      </span>
                    </div>
                  )}
                  {game.noReferees && isAdmin && (
                    <span className="mt-2 inline-block text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      Sin árbitros asignados
                    </span>
                  )}
                </div>

                {/* Estado */}
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0",
                  game.statusColor
                )}>
                  {game.statusLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightTeam(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-brand-100 text-brand-700 rounded px-0.5 not-italic font-bold">
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}
