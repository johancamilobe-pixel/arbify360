"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveSubmission, rejectSubmission } from "@/actions/scoresheets";
import { deleteSubmission } from "@/actions/games";
import { Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";

interface Props {
  academyId:    string;
  submissionId: string;
  adminUserId:  string;
}

export function SubmissionReview({ academyId, submissionId, adminUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject]     = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [comment, setComment]           = useState("");
  const [error, setError]               = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveSubmission(academyId, submissionId, adminUserId, comment || undefined);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al aprobar");
      }
    });
  }

  function handleReject() {
    if (!comment.trim()) {
      setError("Debes indicar el motivo del rechazo");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectSubmission(academyId, submissionId, adminUserId, comment);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al rechazar");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSubmission(academyId, submissionId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Error al eliminar");
        setShowDelete(false);
      }
    });
  }

  return (
    <div className="border-t border-border/50 pt-4 space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Comentario del admin */}
      {!showDelete && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Comentario del admin{showReject && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={showReject ? "Indica el motivo del rechazo..." : "Comentario opcional..."}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
          />
        </div>
      )}

      {/* Botones de acción */}
      {!showDelete && !showReject && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Aprobar
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Confirmar rechazo */}
      {showReject && (
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Confirmar rechazo
          </button>
          <button
            onClick={() => { setShowReject(false); setComment(""); setError(null); }}
            className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Confirmar eliminación */}
      {showDelete && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700 font-medium mb-3">
            ¿Eliminar esta planilla? El árbitro podrá volver a subirla.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setShowDelete(false)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-foreground/80 bg-muted hover:bg-muted rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
