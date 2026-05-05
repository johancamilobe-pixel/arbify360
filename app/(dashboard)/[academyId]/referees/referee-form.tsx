"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addReferee, updateReferee } from "@/actions/referees";
import { Loader2 } from "lucide-react";

interface Category { id: string; name: string; ratePerGame?: string | null }

interface Props {
  academyId:  string;
  categories: Category[];
  mode:       "create" | "edit";
  userId?:    string;
  onSuccess?: () => void;
  defaults?: {
    email?:             string;
    firstName?:         string;
    lastName?:          string;
    documentType?:      string;
    documentNumber?:    string;
    birthDate?:         string;
    phone?:             string;
    phone2?:            string;
    licenseNumber?:     string;
    refereeCategoryId?: string;
  };
}

const DOCUMENT_TYPES = [
  { value: "CC",        label: "Cédula de Ciudadanía" },
  { value: "TI",        label: "Tarjeta de Identidad" },
  { value: "CE",        label: "Cédula de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO",      label: "Otro" },
];

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export function RefereeForm({ academyId, categories, mode, userId, defaults, onSuccess }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [birthDate, setBirthDate]     = useState(defaults?.birthDate ?? "");
  const [selectedCatId, setSelectedCatId] = useState(defaults?.refereeCategoryId ?? "");

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  // Mostrar tarifa de la categoría seleccionada
  const selectedCategory = categories.find((c) => c.id === selectedCatId);
  const categoryRate = selectedCategory?.ratePerGame
    ? `$${Number(selectedCategory.ratePerGame).toLocaleString("es-CO")}`
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await addReferee(academyId, formData)
          : await updateReferee(academyId, userId!, formData);

      if (result.success) {
        if (onSuccess) { router.refresh(); onSuccess(); }
        else { router.push(`/${academyId}/referees`); router.refresh(); }
        return;
      }
      if (result.fieldErrors) { setFieldErrors(result.fieldErrors); return; }
      setError(result.error ?? "Error al guardar");
    });
  }

  function handleCancel() {
    if (onSuccess) onSuccess();
    else router.back();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Datos personales */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Datos personales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombres *" error={fieldErrors.firstName?.[0]}>
            <input name="firstName" placeholder="Ej: Carlos Andrés" defaultValue={defaults?.firstName} className={inputClass} />
          </Field>
          <Field label="Apellidos *" error={fieldErrors.lastName?.[0]}>
            <input name="lastName" placeholder="Ej: Pérez García" defaultValue={defaults?.lastName} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de documento" error={fieldErrors.documentType?.[0]}>
            <select name="documentType" className={inputClass} defaultValue={defaults?.documentType ?? ""}>
              <option value="">Selecciona...</option>
              {DOCUMENT_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </Field>
          <Field label="Número de documento" error={fieldErrors.documentNumber?.[0]}>
            <input name="documentNumber" placeholder="Ej: 1234567890" defaultValue={defaults?.documentNumber} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de nacimiento" error={fieldErrors.birthDate?.[0]}>
            <input name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Edad">
            <div className="flex items-center h-[38px] px-3 bg-background border border-border rounded-lg">
              {age !== null
                ? <span className="text-sm font-medium text-foreground">{age} años</span>
                : <span className="text-sm text-muted-foreground/70">Se calcula automáticamente</span>}
            </div>
          </Field>
        </div>

        <Field label="Email *" error={fieldErrors.email?.[0]}>
          <input name="email" type="email" placeholder="arbitro@email.com" defaultValue={defaults?.email} className={inputClass} />
          {mode === "create" && (
            <p className="text-xs text-brand-600 mt-1">
              📧 Se enviará un email de invitación para que el árbitro defina su contraseña.
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono 1" error={fieldErrors.phone?.[0]}>
            <input name="phone" placeholder="Ej: 3001234567" defaultValue={defaults?.phone} className={inputClass} />
          </Field>
          <Field label="Teléfono 2" error={fieldErrors.phone2?.[0]}>
            <input name="phone2" placeholder="Ej: 3109876543" defaultValue={defaults?.phone2} className={inputClass} />
          </Field>
        </div>

        <Field label="Número de licencia" error={fieldErrors.licenseNumber?.[0]}>
          <input name="licenseNumber" placeholder="Ej: ARB-001" defaultValue={defaults?.licenseNumber} className={inputClass} />
        </Field>
      </div>

      {/* Configuración en la academia */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Configuración en la academia</h2>

        <Field label="Categoría del árbitro" error={fieldErrors.refereeCategoryId?.[0]}>
          <select
            name="refereeCategoryId"
            className={inputClass}
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        {/* Tarifa heredada de la categoría */}
        {selectedCatId && (
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
            <span className="text-sm text-muted-foreground">Tarifa por juego</span>
            {categoryRate ? (
              <span className="text-brand-600 font-bold">{categoryRate}</span>
            ) : (
              <span className="text-xs text-muted-foreground/70">Sin tarifa definida en esta categoría</span>
            )}
          </div>
        )}

        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground/70">
            No tienes categorías de árbitros creadas.{" "}
            <a href={`/${academyId}/settings`} className="text-brand-600 hover:underline">
              Créalas en Configuración →
            </a>
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-background transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Guardando..." : mode === "create" ? "Agregar árbitro" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-card";
