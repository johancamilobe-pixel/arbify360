"use client";

import { useState, useTransition, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { updateAcademy, updateAcademyLogo } from "@/actions/settings";
import { Loader2, Pencil, Check, X, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  academyId:   string;
  academyName: string;
  logoUrl:     string | null;
}

export function AcademyInfoPanel({ academyId, academyName, logoUrl }: Props) {
  // ── Nombre ──────────────────────────────────────────────────────────────────
  const [editing, setEditing]        = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nameError, setNameError]    = useState<string | null>(null);

  // ── Logo ────────────────────────────────────────────────────────────────────
  const [currentLogo, setCurrentLogo]   = useState<string | null>(logoUrl);
  const [uploading, setUploading]       = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Handlers nombre ─────────────────────────────────────────────────────────
  function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAcademy(academyId, formData);
      if (result.success) {
        setEditing(false);
      } else {
        setNameError(result.error ?? "Error al guardar");
      }
    });
  }

  // ── Handlers logo ───────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
  toast.error("La imagen no puede superar 10MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/heic", "image/heif"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato no permitido. Usa JPG, PNG, WebP o SVG");
      return;
    }

    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${academyId}/logo/logo.${ext}`; 

      const { error: uploadError } = await supabase.storage
        .from("SANDBOX")
  .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("SANDBOX")
        .getPublicUrl(path);

      // Cache-bust para forzar refresco de la imagen
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const result = await updateAcademyLogo(academyId, data.publicUrl);
      if (!result.success) throw new Error(result.error);

      setCurrentLogo(publicUrl);
      toast.success("Logo actualizado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el logo. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    setUploading(true);
    try {
      // Intentar eliminar todas las extensiones posibles
      await supabase.storage
        .from("SANDBOX")
        .remove([
          `${academyId}/logo.jpg`,
          `${academyId}/logo.jpeg`,
          `${academyId}/logo.png`,
          `${academyId}/logo.webp`,
          `${academyId}/logo.svg`,
        ]);

      const result = await updateAcademyLogo(academyId, "");
      if (!result.success) throw new Error(result.error);

      setCurrentLogo(null);
      toast.success("Logo eliminado");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el logo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Nombre de la academia ─────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Nombre de la academia
        </label>
        {editing ? (
          <form onSubmit={handleNameSubmit} className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={academyName}
              autoFocus
              required
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-card"
            />
            <button
              type="submit"
              disabled={isPending}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setNameError(null); }}
              className="p-2 text-muted-foreground/70 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{academyName}</span>
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-muted-foreground/70 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
      </div>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Logo de la academia
        </label>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Logo academia"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl font-bold text-brand-600">
                {academyName[0]?.toUpperCase()}
              </span>
            )}

            {/* Spinner encima mientras sube */}
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {currentLogo ? "Cambiar logo" : "Subir logo"}
            </button>

            {currentLogo && !uploading && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar logo
              </button>
            )}

            <p className="text-xs text-muted-foreground/60">
              JPG, PNG, WebP, SVG o HEIC · Máx. 10MB
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/heic,image/heif"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
}