"use client";

import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle2, Clock, FileX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Juego {
  gameId:          string;
  homeTeam:        string;
  awayTeam:        string;
  sport:           string;
  category:        string;
  venue:           string;
  startTime:       string;
  role:            string;
  subStatus:       string | null;
  monto:           string;
  pagado:          boolean;
  pagoFecha:       string | null;
  pagoRecibo:      string | null;
  pagoMetodoLabel: string | null;
}

interface Summary {
  refereeName:    string;
  refereeEmail:   string;
  academyName:    string;
  generatedAt:    string;
  totalJuegos:    number;
  totalPagado:    string;
  totalPendiente: string;
  juegos:         Juego[];
}

interface Props {
  summary:   Summary;
  academyId: string;
}

function EstadoBadge({ juego }: { juego: Juego }) {
  if (juego.pagado) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Pagado
    </span>
  );
  if (juego.subStatus === "APPROVED") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Por cobrar
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <FileX className="w-3 h-3" /> Sin planilla
    </span>
  );
}

export function RefereeSummaryView({ summary, academyId }: Props) {
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

      {/* Documento */}
      <div className="bg-card rounded-xl border border-border overflow-hidden print:border-none print:rounded-none">

        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-border bg-muted/30 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Resumen de Juegos Arbitrados</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{summary.academyName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Generado el</p>
              <p className="text-sm font-medium text-foreground">{summary.generatedAt}</p>
            </div>
          </div>
        </div>

        {/* Info árbitro */}
        <div className="px-6 py-4 border-b border-border/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Árbitro</p>
              <p className="text-sm font-semibold text-foreground">{summary.refereeName}</p>
              <p className="text-xs text-muted-foreground">{summary.refereeEmail}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{summary.totalJuegos}</p>
                <p className="text-xs text-muted-foreground">Juegos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">{summary.totalPendiente}</p>
                <p className="text-xs text-muted-foreground">Por cobrar</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{summary.totalPagado}</p>
                <p className="text-xs text-muted-foreground">Cobrado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de juegos */}
        <div className="px-6 py-5">
          {summary.juegos.length === 0 ? (
            <p className="text-sm text-muted-foreground/70 text-center py-8">
              No tienes juegos registrados aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Juego</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Pago</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {summary.juegos.map((j) => (
                    <tr key={j.gameId} className="align-top">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-foreground leading-tight">
                          {j.homeTeam} vs {j.awayTeam}
                        </p>
                        <p className="text-xs text-muted-foreground">{j.sport} · {j.venue}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{j.startTime}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">{j.role}</td>
                      <td className="py-3 pr-3">
                        <EstadoBadge juego={j} />
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {j.pagado && j.pagoFecha ? (
                          <span>
                            {j.pagoFecha}
                            {j.pagoMetodoLabel && <><br />{j.pagoMetodoLabel}</>}
                            {j.pagoRecibo && <><br />#{j.pagoRecibo}</>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={cn(
                        "py-3 text-right font-semibold",
                        j.pagado ? "text-green-700" : j.subStatus === "APPROVED" ? "text-orange-700" : "text-muted-foreground"
                      )}>
                        {j.monto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50 print:bg-white">
          <div className="flex justify-end gap-8">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Por cobrar</p>
              <p className="text-lg font-bold text-orange-600">{summary.totalPendiente}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total cobrado</p>
              <p className="text-lg font-bold text-green-600">{summary.totalPagado}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
