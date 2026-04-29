"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cn,
  GAME_ROLE_LABELS,
} from "@/lib/utils";
import { voidPayment } from "@/actions/payments";
import type { PaymentDetail } from "@/actions/payments";
import { toast } from "sonner";

interface Props {
  payment: PaymentDetail;
  academyId: string;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia bancaria",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
};

const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

export function ReceiptView({ payment, academyId }: Props) {
  const router = useRouter();
  const [voiding, setVoiding] = useState(false);

  async function handleVoid() {
    if (
      !confirm(
        "¿Estás seguro de anular este pago? Los juegos volverán a quedar pendientes de pago."
      )
    )
      return;

    setVoiding(true);
    try {
      const result = await voidPayment(academyId, payment.id);
      if (result.success) {
        toast.success("Pago anulado exitosamente");
        router.push(`/${academyId}/payments?tab=history`);
      } else {
        toast.error(result.error || "Error al anular pago");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setVoiding(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* Toolbar (no se imprime) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/${academyId}/payments?tab=history`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al historial
        </Link>
        <div className="flex gap-2">
          {payment.status === "COMPLETED" && (
            <button
              onClick={handleVoid}
              disabled={voiding}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {voiding ? "Anulando..." : "Anular pago"}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimir recibo
          </button>
        </div>
      </div>

      {/* Recibo */}
      <div
        id="receipt"
        className="bg-card rounded-xl border border-border overflow-hidden print:border-none print:shadow-none"
      >
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-border/50 print:border-b-2 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Recibo de Pago
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {payment.academyName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                {payment.receiptNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.paidAt)}
              </p>
              {payment.status === "VOIDED" && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">
                  ANULADO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info del pago */}
        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Árbitro</p>
            <p className="text-sm font-medium text-foreground">
              {payment.refereeName}
            </p>
            <p className="text-xs text-muted-foreground">{payment.refereeEmail}</p>
            {payment.refereeCategory && (
              <p className="text-xs text-muted-foreground">
                Categoría: {payment.refereeCategory}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Período</p>
            <p className="text-sm font-medium text-foreground">
              {PERIOD_LABELS[payment.periodType] || payment.periodType}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Método de pago</p>
            <p className="text-sm font-medium text-foreground">
              {METHOD_LABELS[payment.method] || payment.method}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registrado por</p>
            <p className="text-sm font-medium text-foreground">
              {payment.paidByName}
            </p>
          </div>
        </div>

        {/* Detalle de juegos */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Detalle de juegos ({payment.items.length})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Juego
                </th>
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Rol
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {payment.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-foreground">
                    {item.homeTeam} vs {item.awayTeam}
                    <span className="block text-xs text-muted-foreground">
                      {item.venue}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {formatDateTime(item.startTime)}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {GAME_ROLE_LABELS[item.gameRole] || item.gameRole}
                  </td>
                  <td className="py-2 text-right font-medium text-foreground">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-between">
          <div>
            {payment.notes && (
              <p className="text-xs text-muted-foreground">
                Notas: {payment.notes}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(payment.totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
