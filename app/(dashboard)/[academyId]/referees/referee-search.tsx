"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, X, Phone, FileText, CheckSquare, Square, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { deleteMultipleReferees } from "@/actions/referees";

interface Referee {
  userId:        string;
  name:          string;
  email:         string;
  photoUrl:      string | null;
  phone:         string | null;
  licenseNumber: string | null;
  categoryName:  string | null;
  ratePerGame:   string | null;
  isActive:      boolean;
}

interface Props {
  academyId: string;
  referees:  Referee[];
}

export function RefereeSearch({ academyId, referees }: Props) {
  const [query, setQuery]             = useState("");
  const [selectMode, setSelectMode]   = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return referees;
    return referees.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.licenseNumber?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    );
  }, [query, referees]);

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
      setSelected(new Set(filtered.map((r) => r.userId)));
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
      `¿Eliminar ${count} árbitro${count !== 1 ? "s" : ""} de la academia? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteMultipleReferees(academyId, Array.from(selected));
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email, licencia o teléfono..."
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

        {/* Botón seleccionar */}
        {!selectMode && (
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
      {selectMode && (
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

      {/* Contador */}
      {query && (
        <p className="text-xs text-muted-foreground/70">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} para "${query}"`}
        </p>
      )}

      {/* Grid */}
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
            <div key={r.userId}>
              {selectMode ? (
                <div
                  onClick={() => toggleSelect(r.userId)}
                  className={`bg-card rounded-xl border p-5 cursor-pointer transition-all ${
                    selected.has(r.userId)
                      ? "border-red-300 bg-red-50/30"
                      : "border-border hover:border-brand-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {selected.has(r.userId)
                      ? <CheckSquare className="w-5 h-5 text-red-500 flex-shrink-0" />
                      : <Square className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />}
                  </div>
                  <RefereeCard r={r} query={query} />
                </div>
              ) : (
                <Link
                  href={`/${academyId}/referees/${r.userId}`}
                  className="block bg-card rounded-xl border border-border p-5 hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <RefereeCard r={r} query={query} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RefereeCard({ r, query }: { r: Referee; query: string }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {r.photoUrl ? (
            <img src={r.photoUrl} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-brand-600 font-bold text-sm">{getInitials(r.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{highlight(r.name, query)}</p>
          {r.categoryName && (
            <span className="text-xs text-brand-600 font-medium">{r.categoryName}</span>
          )}
        </div>
      </div>

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
    </>
  );
}

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
        ) : part
      )}
    </>
  );
}