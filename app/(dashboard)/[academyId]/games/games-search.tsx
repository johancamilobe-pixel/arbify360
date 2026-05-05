"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, X, Calendar, MapPin, Users, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteMultipleGames } from "@/actions/games";

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
  const [query, setQuery]           = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((g) => g.id)));
    }
  }

  function cancelSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setError(null);
  }

  function handleDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    const confirmed = window.confirm(
      `¿Eliminar ${count} juego${count !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteMultipleGames(academyId, Array.from(selected));
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error ?? "Error al eliminar");
      }
    });
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="space-y-4">

      {/* Barra superior */}
      <div className="flex items-center gap-2">
        {/* Buscador */}
        <div className="relative flex-1">
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

        {/* Botón seleccionar — solo admin */}
        {isAdmin && !selectMode && (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
          >
            <CheckSquare className="w-4 h-4" />
            Seleccionar
          </button>
        )}
      </div>

      {/* Barra de acciones en modo selección */}
      {isAdmin && selectMode && (
        <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-brand-600 transition-colors"
            >
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-brand-500" />
                : <Square className="w-4 h-4" />}
              {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
            <span className="text-xs text-muted-foreground">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={selected.size === 0 || isPending}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              {isPending ? "Eliminando..." : "Eliminar"}
            </button>
            <button
              onClick={cancelSelectMode}
              disabled={isPending}
              className="px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Contador búsqueda */}
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
            <div key={game.id} className="relative">
              {selectMode ? (
                /* Modo selección — no navega, solo selecciona */
                <div
                  onClick={() => toggleSelect(game.id)}
                  className={cn(
                    "flex items-start gap-3 bg-card rounded-xl border p-5 cursor-pointer transition-all",
                    selected.has(game.id)
                      ? "border-red-300 bg-red-50/30"
                      : "border-border hover:border-brand-300"
                  )}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    {selected.has(game.id)
                      ? <CheckSquare className="w-5 h-5 text-red-500" />
                      : <Square className="w-5 h-5 text-muted-foreground/50" />}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <GameCard game={game} isAdmin={isAdmin} query={query} />
                  </div>
                </div>
              ) : (
                /* Modo normal — navega al detalle */
                <Link
                  href={`/${academyId}/games/${game.id}`}
                  className="block bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <GameCard game={game} isAdmin={isAdmin} query={query} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game, isAdmin, query }: { game: Game; isAdmin: boolean; query: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-lg">
          {highlightTeam(game.homeTeam, query)}{" "}
          <span className="text-muted-foreground/70 font-normal text-base">vs</span>{" "}
          {highlightTeam(game.awayTeam, query)}
        </p>
        <p className="text-sm text-brand-600 font-medium mt-0.5">
          {game.sport} · {game.category}
        </p>
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
      <span className={cn(
        "text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0",
        game.statusColor
      )}>
        {game.statusLabel}
      </span>
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