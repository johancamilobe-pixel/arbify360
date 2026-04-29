"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

interface ReceiptItem {
  id:        string;
  homeTeam:  string;
  awayTeam:  string;
  venue:     string;
  sport:     string;
  startTime: string;
  gameRole:  string;
  amount:    string;
}

interface Receipt {
  id:            string;
  receiptNumber: string;
  academyName:   string;
  refereeName:   string;
  refereeEmail:  string;
  periodType:    string;
  periodStart:   string;
  periodEnd:     string;
  method:        string;
  paidAt:        string;
  paidByName:    string;
  totalAmount:   string;
  status:        string;
  items:         ReceiptItem[];
}

interface Props {
  receipt:   Receipt;
  academyId: string;
}

export function RefereeReceiptView({ receipt, academyId }: Props) {
  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* Toolbar — no se imprime */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/${academyId}/my-payments`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis pagos
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Recibo */}
      <div className="bg-card rounded-xl border border-border overflow-hidden print:border-none print:rounded-none print:shadow-none">

        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-border bg-muted/30 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Recibo de Pago</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{receipt.academyName}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-foreground">{receipt.receiptNumber}</p>
              <p className="text-sm text-muted-foreground">{receipt.paidAt}</p>
              {receipt.status === "VOIDED" && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded">
                  ANULADO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info del árbitro y pago */}
        <div className="px-6 py-5 grid grid-cols-2 gap-6 border-b border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Árbitro</p>
            <p className="text-sm font-semibold text-foreground">{receipt.refereeName}</p>
            <p className="text-xs text-muted-foreground">{receipt.refereeEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Período</p>
            <p className="text-sm font-semibold text-foreground">{receipt.periodType}</p>
            <p className="text-xs text-muted-foreground">{receipt.periodStart} — {receipt.periodEnd}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Método de pago</p>
            <p className="text-sm font-semibold text-foreground">{receipt.method}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pagado por</p>
            <p className="text-sm font-semibold text-foreground">{receipt.paidByName}</p>
          </div>
        </div>

        {/* Detalle de juegos */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Detalle de juegos ({receipt.items.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Juego</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Rol</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {receipt.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{item.homeTeam} vs {item.awayTeam}</p>
                      <p className="text-xs text-muted-foreground">{item.sport} · {item.venue}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{item.startTime}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{item.gameRole}</td>
                    <td className="py-3 text-right font-semibold text-foreground">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-end print:bg-white">
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Total recibido</p>
            <p className="text-3xl font-bold text-foreground">{receipt.totalAmount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
