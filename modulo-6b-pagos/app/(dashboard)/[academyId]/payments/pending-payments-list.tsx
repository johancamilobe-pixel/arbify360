"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getInitials, cn, GAME_ROLE_LABELS, formatDateTime } from "@/lib/utils";
import { createPayment } from "@/actions/payments";
import type { RefereePendingGroup } from "@/actions/payments";
import { toast } from "sonner";

interface Props {
  academyId: string;
  groups: RefereePendingGroup[];
  periodType: string;
}

const METHOD_OPTIONS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia" },
  { value: "NEQUI", label: "Nequi" },
  { value: "DAVIPLATA", label: "Daviplata" },
] as const;

export function PendingPaymentsList({ academyId, groups, periodType }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("CASH");
  const [loading, setLoading] = useState(false);

  if (groups.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          No hay pagos pendientes en este período
        </p>
      </div>
    );
  }

  async function handlePay(group: RefereePendingGroup) {
    setLoading(true);
    try {
      // Determinar período
      const dates = group.submissions.map((s) => new Date(s.startTime));
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

      const result = await createPayment(academyId, {
        refereeId: group.userId,
        submissionIds: group.submissions.map((s) => s.submissionId),
        method: selectedMethod as any,
        periodType: periodType as any,
        periodStart: minDate.toISOString(),
        periodEnd: maxDate.toISOString(),
      });

      if (result.success) {
        toast.success("Pago registrado exitosamente");
        if (result.paymentId) {
          router.push(`/${academyId}/payments/${result.paymentId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Error al registrar pago");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedId === group.userId;
        const isPaying = payingId === group.userId;

        return (
          <div
            key={group.userId}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Header del árbitro */}
            <button
              onClick={() =>
                setExpandedId(isExpanded ? null : group.userId)
              }
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-muted-foreground">
                  {getInitials(group.userName)}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {group.userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.category && (
                    <span>{group.category} · </span>
                  )}
                  {group.submissions.length} juego
                  {group.submissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(group.totalAmount)}
                </p>
              </div>
              <svg
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Detalle expandido */}
            {isExpanded && (
              <div className="border-t border-border/50">
                {/* Lista de juegos */}
                <div className="divide-y divide-border/30">
                  {group.submissions.map((sub) => (
                    <div
                      key={sub.submissionId}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {sub.homeTeam} vs {sub.awayTeam}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(sub.startTime)} ·{" "}
                          {GAME_ROLE_LABELS[sub.gameRole] || sub.gameRole} ·{" "}
                          {sub.categoryName}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(sub.paymentAmount)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Acción de pago */}
                {!isPaying ? (
                  <div className="px-5 py-3 bg-muted/30 flex justify-end">
                    <button
                      onClick={() => setPayingId(group.userId)}
                      className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      Registrar pago
                    </button>
                  </div>
                ) : (
                  <div className="px-5 py-4 bg-muted/30 border-t border-border/50">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Método de pago
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {METHOD_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setSelectedMethod(m.value)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                            selectedMethod === m.value
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-card text-foreground border-border hover:border-brand-400"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                      <p className="text-sm text-muted-foreground">
                        Total:{" "}
                        <span className="font-bold text-foreground">
                          {formatCurrency(group.totalAmount)}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayingId(null)}
                          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handlePay(group)}
                          disabled={loading}
                          className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? "Procesando..." : "Confirmar pago"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
