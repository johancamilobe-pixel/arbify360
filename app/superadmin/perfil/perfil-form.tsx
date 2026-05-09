"use client";

import { useState, useTransition } from "react";
import { updateSuperAdminProfile } from "@/actions/superadmin";
import { Loader2, Check } from "lucide-react";

interface Props {
  defaults: {
    firstName: string;
    lastName:  string;
    phone:     string;
  };
}

export function SuperAdminPerfilForm({ defaults }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  const [form, setForm] = useState(defaults);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    startTransition(async () => {
      const result = await updateSuperAdminProfile(form);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Perfil actualizado correctamente
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Nombres</label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Apellidos</label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">Teléfono</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="3001234567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
        <div className="flex items-center h-[38px] px-3 bg-background border border-border rounded-lg">
          <span className="text-sm text-muted-foreground">johancamilobe@gmail.com</span>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-0.5">El email no puede modificarse</p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
