"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitScoresheet } from "@/actions/scoresheets";
import { Upload, Loader2, Image, X } from "lucide-react";

interface Props {
  academyId: string;
  gameId:    string;
  userId:    string;
  role:      string;
  isResubmit?: boolean;
}

export function SubmissionUpload({ academyId, gameId, userId, role, isResubmit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("La foto no puede pesar más de 5MB");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes (JPG, PNG, etc.)");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearPreview() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!preview) {
      setError("Selecciona una foto de la planilla");
      return;
    }

    setError(null);

    startTransition(async () => {
      // Por ahora usamos la URL base64 directamente.
      // En producción se sube a Cloudinary y se guarda la URL retornada.
      const result = await submitScoresheet(
        academyId,
        gameId,
        userId,
        role,
        preview,
        comment || undefined
      );

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al subir la planilla");
      }
    });
  }

  return (
    <div className="border-t border-border/50 pt-4 space-y-3">
      {isResubmit && (
        <p className="text-sm text-red-500 font-medium">
          Tu planilla fue rechazada. Por favor sube una nueva foto.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Preview */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-60 object-contain rounded-lg border border-border bg-background"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-card rounded-full p-1 shadow-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground/70 mb-2" />
          <span className="text-sm text-muted-foreground">Toca para subir foto de la planilla</span>
          <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG — máx. 5MB</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* Comentario */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Alguna observación sobre el juego..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
        />
      </div>

      {/* Botón enviar */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !preview}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Image className="w-4 h-4" />
        )}
        {isPending ? "Subiendo..." : isResubmit ? "Reenviar planilla" : "Subir planilla"}
      </button>
    </div>
  );
}
