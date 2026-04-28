"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/actions/profile";
import { Loader2, Check } from "lucide-react";

interface Props {
  academyId: string;
  defaults: {
    firstName:      string;
    lastName:       string;
    email:          string;
    documentType?:  string;
    documentNumber?: string;
    birthDate?:     string;
    phone?:         string;
    phone2?:        string;
    licenseNumber?: string;
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
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export function ProfileForm({ academyId, defaults }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [birthDate, setBirthDate]     = useState(defaults.birthDate ?? "");
  const [saved, setSaved]             = useState(false);

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateMyProfile(academyId, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
        return;
      }
      if (result.fieldErrors) { setFieldErrors(result.fieldErrors); return; }
      setError(result.error ?? "Error al guardar");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Perfil actualizado correctamente
        </div>
      )}

      {/* Datos personales */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Datos personales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombres *" error={fieldErrors.firstName?.[0]}>
            <input name="firstName" defaultValue={defaults.firstName} className={inputClass} />
          </Field>
          <Field label="Apellidos *" error={fieldErrors.lastName?.[0]}>
            <input name="lastName" defaultValue={defaults.lastName} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de documento">
            <select name="documentType" className={inputClass} defaultValue={defaults.documentType ?? ""}>
              <option value="">Selecciona...</option>
              {DOCUMENT_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
          </Field>
          <Field label="Número de documento">
            <input name="documentNumber" defaultValue={defaults.documentNumber} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha de nacimiento">
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

        {/* Email solo lectura */}
        <Field label="Email">
          <div className="flex items-center h-[38px] px-3 bg-background border border-border rounded-lg">
            <span className="text-sm text-muted-foreground">{defaults.email}</span>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-0.5">El email se gestiona desde tu cuenta de Clerk</p>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono 1">
            <input name="phone" defaultValue={defaults.phone} className={inputClass} />
          </Field>
          <Field label="Teléfono 2">
            <input name="phone2" defaultValue={defaults.phone2} className={inputClass} />
          </Field>
        </div>

        <Field label="Número de licencia">
          <input name="licenseNumber" defaultValue={defaults.licenseNumber} className={inputClass} />
        </Field>
      </div>

      {/* Botón */}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Guardando..." : "Guardar cambios"}
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
