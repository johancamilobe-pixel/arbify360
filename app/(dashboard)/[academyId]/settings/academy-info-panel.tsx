"use client";

import { useState, useTransition } from "react";
import { updateAcademy } from "@/actions/settings";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface Props {
  academyId:   string;
  academyName: string;
}

export function AcademyInfoPanel({ academyId, academyName }: Props) {
  const [editing, setEditing]        = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAcademy(academyId, formData);
      if (result.success) {
        setEditing(false);
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Nombre de la academia */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Nombre de la academia
        </label>
        {editing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={academyName}
              autoFocus
              required
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-card"
            />
            <button type="submit" disabled={isPending}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null); }}
              className="p-2 text-muted-foreground/70 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{academyName}</span>
            <button onClick={() => setEditing(true)}
              className="p-1 text-muted-foreground/70 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Logo (pendiente Cloudinary) */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Logo</label>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
            <span className="text-brand-600 font-bold text-lg">
              {academyName[0]?.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Subida de logo disponible próximamente
          </p>
        </div>
      </div>
    </div>
  );
}
