"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from "lucide-react";
import type { ActionResult } from "@/actions/settings";

interface Category {
  id:            string;
  name:          string;
  incomePerGame?: string | null; // solo para categorías de juego
  count?:        number;         // árbitros o juegos que la usan
}

interface Props {
  categories:    Category[];
  showIncome?:   boolean;       // true para mostrar campo de dinero
  incomeLabel?:  string;        // label personalizado del campo
  onAdd:    (formData: FormData) => Promise<ActionResult>;
  onUpdate: (id: string, formData: FormData) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
}

export function CategoryManager({ categories, showIncome, incomeLabel, onAdd, onUpdate, onDelete }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [addingNew, setAddingNew]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [editError, setEditError]   = useState<string | null>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const result = await onAdd(formData);
      if (result.success) {
        setAddingNew(false);
        form.reset();
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onUpdate(id, formData);
      if (result.success) {
        setEditingId(null);
      } else {
        setEditError(result.error ?? "Error al guardar");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.success) {
        setError(result.error ?? "Error al eliminar");
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Lista de categorías */}
      {categories.length === 0 && !addingNew && (
        <p className="text-sm text-muted-foreground/70 py-2">No hay categorías creadas aún.</p>
      )}

      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/50">
          {editingId === cat.id ? (
            /* Modo edición */
            <form onSubmit={(e) => handleUpdate(cat.id, e)} className="flex-1 flex items-start gap-2 flex-wrap">
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  name="name"
                  defaultValue={cat.name}
                  autoFocus
                  className={inputClass}
                  placeholder="Nombre"
                />
                {showIncome && (
                  <input
                    name="incomePerGame"
                    type="number"
                    defaultValue={cat.incomePerGame ?? ""}
                    className={inputClass}
                    placeholder={incomeLabel ?? "Ingreso por juego (COP)"}
                    min="0"
                  />
                )}
                {editError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{editError}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button type="submit" disabled={isPending}
                  className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => { setEditingId(null); setEditError(null); }}
                  className="p-1.5 text-muted-foreground/70 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Modo vista */
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
                {showIncome && cat.incomePerGame && (
                  <p className="text-xs text-muted-foreground/70">
                    Ingreso por juego: <span className="text-green-600 font-medium">
                      ${Number(cat.incomePerGame).toLocaleString("es-CO")}
                    </span>
                  </p>
                )}
                {cat.count !== undefined && cat.count > 0 && (
                  <p className="text-xs text-muted-foreground/70">
                    {cat.count} {showIncome ? "juego" : "árbitro"}{cat.count !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setEditingId(cat.id); setEditError(null); }}
                  className="p-1.5 text-muted-foreground/70 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat.id)} disabled={isPending}
                  className="p-1.5 text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Formulario nueva categoría */}
      {addingNew && (
        <form onSubmit={handleAdd} className="p-3 bg-brand-50 rounded-lg border border-brand-100 space-y-2">
          <input
            name="name"
            autoFocus
            required
            placeholder="Nombre de la categoría"
            className={inputClass}
          />
          {showIncome && (
            <input
              name="incomePerGame"
              type="number"
              placeholder={incomeLabel ?? "Ingreso por juego en COP (opcional)"}
              className={inputClass}
              min="0"
            />
          )}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70">
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Guardar
            </button>
            <button type="button" onClick={() => { setAddingNew(false); setError(null); }}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-background transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Error general */}
      {error && !addingNew && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}

      {/* Botón agregar */}
      {!addingNew && (
        <button
          onClick={() => { setAddingNew(true); setError(null); }}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar categoría
        </button>
      )}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
