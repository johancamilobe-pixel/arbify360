"use client";

import { useState, useTransition, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { submitScoresheet, deleteMySubmission } from "@/actions/scoresheets";
import { Upload, Loader2, X, ZoomIn, Trash2, Send } from "lucide-react";

interface Props {
  academyId:     string;
  gameId:        string;
  userId:        string;
  role:          string;
  isResubmit?:   boolean;
  submissionId?: string;  // si ya tiene una subida pendiente/rechazada
  currentPhoto?: string;  // URL actual si ya subió
}

export function SubmissionUpload({
  academyId, gameId, userId, role,
  isResubmit, submissionId, currentPhoto,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment]       = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("La foto no puede pesar más de 10MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes (JPG, PNG, HEIC, etc.)");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearPreview() {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!selectedFile || !preview) {
      setError("Selecciona una foto de la planilla");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const ext  = selectedFile.name.split(".").pop() || "jpg";
        const path = `${academyId}/scoresheets/${gameId}-${userId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("SANDBOX")
          .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("SANDBOX").getPublicUrl(path);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

        const result = await submitScoresheet(
          academyId, gameId, userId, role,
          publicUrl, comment || undefined
        );

        if (result.success) {
          window.location.reload();
        } else {
          setError(result.error ?? "Error al subir la planilla");
        }
      } catch (err) {
        console.error(err);
        setError("Error al subir la foto. Intenta de nuevo.");
      }
    });
  }

async function handleDelete() {
  if (!submissionId) return;
  setDeleting(true);
  try {
    // Eliminar archivo de Supabase Storage
    await supabase.storage
      .from("SANDBOX")
      .remove([
        `${academyId}/scoresheets/${gameId}-${userId}.jpg`,
        `${academyId}/scoresheets/${gameId}-${userId}.jpeg`,
        `${academyId}/scoresheets/${gameId}-${userId}.png`,
        `${academyId}/scoresheets/${gameId}-${userId}.webp`,
        `${academyId}/scoresheets/${gameId}-${userId}.heic`,
        `${academyId}/scoresheets/${gameId}-${userId}.heif`,
      ]);

    // Eliminar de la BD
    const result = await deleteMySubmission(academyId, submissionId);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error ?? "Error al eliminar");
    }
  } catch {
    setError("Error al eliminar la planilla");
  } finally {
    setDeleting(false);
  }
}

  return (
    <div className="border-t border-border/50 pt-4 space-y-3">
      {isResubmit && (
        <p className="text-sm text-red-500 font-medium">
          Tu planilla fue rechazada. Por favor sube una nueva foto.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Foto actual (ya subida, pendiente o rechazada) */}
      {currentPhoto && !preview && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Foto actual:</p>
          <div className="relative group">
            <img
              src={currentPhoto}
              alt="Planilla actual"
              className="w-full max-h-60 object-contain rounded-lg border border-border bg-background"
            />
            {/* Ver en grande */}
            <button
              onClick={() => setShowModal(true)}
              className="absolute top-2 left-2 bg-black/50 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Ver
            </button>
          </div>

          {/* Acciones sobre foto actual */}
          <div className="flex gap-2">
            
            {submissionId && (
              <button
                onClick={handleDelete}
                disabled={isPending || deleting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview nueva foto seleccionada */}
      {preview && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Nueva foto seleccionada:</p>
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-60 object-contain rounded-lg border border-brand-400 bg-background"
            />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 bg-card rounded-full p-1 shadow-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="absolute top-2 left-2 bg-black/50 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Ver
            </button>
          </div>
        </div>
      )}

      {/* Upload zone — solo si no hay preview ni foto actual */}
      {!preview && !currentPhoto && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground/70 mb-2" />
          <span className="text-sm text-muted-foreground">Toca para subir foto de la planilla</span>
          <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, HEIC — máx. 10MB</span>
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

      {/* Input oculto para cambiar foto */}
      

      {/* Comentario y botón enviar — solo cuando hay nueva foto seleccionada */}
      {preview && (
        <>
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

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
            {isPending ? "Subiendo..." : isResubmit ? "Reenviar planilla" : "Subir planilla"}
          </button>
        </>
      )}

      {/* Modal ver foto en grande */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={preview || currentPhoto || ""}
              alt="Planilla"
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}