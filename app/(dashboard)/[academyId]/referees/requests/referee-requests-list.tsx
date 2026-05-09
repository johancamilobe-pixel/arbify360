"use client";

import { useState } from "react";
import { acceptRefereeRequest, rejectRefereeRequest } from "@/actions/referee-requests";
import { Check, X, User, Mail, CreditCard, Calendar } from "lucide-react";

interface RefereeRequest {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  createdAt: Date;
}

interface Props {
  requests: RefereeRequest[];
  academyId: string;
}

export function RefereeRequestsList({ requests: initialRequests, academyId }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAccept(requestId: string) {
    setLoadingId(requestId);
    setError("");

    const result = await acceptRefereeRequest(requestId, academyId);

    if (result.error) {
      setError(result.error);
      setLoadingId(null);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setLoadingId(null);
  }

  async function handleReject(requestId: string) {
    setLoadingId(requestId);
    setError("");

    const result = await rejectRefereeRequest(requestId, academyId);

    if (result.error) {
      setError(result.error);
      setLoadingId(null);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setLoadingId(null);
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground font-medium">No hay solicitudes pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {requests.map((request) => {
        const isLoading = loadingId === request.id;

        return (
          <div
            key={request.id}
            className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
          >
            {/* Avatar iniciales */}
            <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {request.firstName[0]}{request.lastName[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {request.firstName} {request.lastName}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {request.email}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CreditCard className="w-3 h-3" />
                  CC {request.documentNumber}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(request.createdAt).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleReject(request.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-muted-foreground text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Rechazar
              </button>
              <button
                onClick={() => handleAccept(request.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isLoading ? "Procesando..." : "Aceptar"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
