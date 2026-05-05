"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { updateRefereePhoto } from "@/actions/referees";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  academyId: string;
  userId:    string;
  photoUrl:  string | null;
  name:      string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function RefereePhotoUpload({ academyId, userId, photoUrl, name }: Props) {
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(photoUrl);
  const [uploading, setUploading]       = useState(false);
  const inputRef                        = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La foto no puede pesar más de 10MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    setUploading(true);
    try {
      const ext  = file.name.split(".").pop() || "jpg";
      const path = `${academyId}/referees/${userId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("SANDBOX")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("SANDBOX").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const result = await updateRefereePhoto(academyId, userId, data.publicUrl);
      if (!result.success) throw new Error(result.error);

      setCurrentPhoto(publicUrl);
      toast.success("Foto actualizada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la foto. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      await supabase.storage
        .from("SANDBOX")
        .remove([
          `${academyId}/referees/${userId}.jpg`,
          `${academyId}/referees/${userId}.jpeg`,
          `${academyId}/referees/${userId}.png`,
          `${academyId}/referees/${userId}.webp`,
          `${academyId}/referees/${userId}.heic`,
          `${academyId}/referees/${userId}.heif`,
        ]);

      const result = await updateRefereePhoto(academyId, userId, "");
      if (!result.success) throw new Error(result.error);

      setCurrentPhoto(null);
      toast.success("Foto eliminada");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la foto");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="relative w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {currentPhoto ? (
          <img src={currentPhoto} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-brand-600 font-bold text-xl">{getInitials(name)}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
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
          <Camera className="w-3.5 h-3.5" />
          {currentPhoto ? "Cambiar foto" : "Subir foto"}
        </button>

        {currentPhoto && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar foto
          </button>
        )}

        <p className="text-xs text-muted-foreground/60">
          JPG, PNG, HEIC — Máx. 10MB
        </p>
      </div>

      {/* Input — permite cámara y galería */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}