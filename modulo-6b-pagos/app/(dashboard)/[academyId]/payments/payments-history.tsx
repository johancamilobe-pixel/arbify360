"use client";

import Link from "next/link";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { PaymentRecord } from "@/actions/payments";

interface Props {
  academyId: string;
  payments: PaymentRecord[];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
};

const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

export function PaymentsHistory({ academyId, payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          No hay pagos registrados en este período
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Recibo
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Árbitro
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Período
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Método
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                Monto
              </th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                Estado
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/${academyId}/payments/${payment.id}`}
                    className="text-brand-600 hover:underline font-medium"
                  >
                    {payment.receiptNumber || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {payment.refereeName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {PERIOD_LABELS[payment.periodType] || payment.periodType}
                  <span className="text-xs block">
                    {payment.itemCount} juego
                    {payment.itemCount !== 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {METHOD_LABELS[payment.method] || payment.method}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {formatCurrency(payment.totalAmount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {payment.status === "COMPLETED" ? "Pagado" : "Anulado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">
                  {formatDate(payment.paidAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
