"use client";

import { useState } from "react";
import { Wallet, Clock, CheckCircle2, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface Juego {
  gameId:     string;
  homeTeam:   string;
  awayTeam:   string;
  sport:      string;
  date:       string;
  monto:      string;
  pagoFecha:  string | null;
  pagoRecibo: string | null;
}

interface Props {
  pagos: {
    pagados:        Juego[];
    pendientes:     Juego[];
    totalPagado:    string;
    totalPendiente: string;
  };
}

export function RefereePagosCard({ pagos }: Props) {
  const [showPagados,   setShowPagados]   = useState(false);
  const [showPendientes, setShowPendientes] = useState(true);

  const hayPagados    = pagos.pagados.length > 0;
  const hayPendientes = pagos.pendientes.length > 0;

  if (!hayPagados && !hayPendientes) {
    return (
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Mis pagos</h2>
        </div>
        <p className="text-sm text-muted-foreground/70">
          Aún no tienes planillas aprobadas con información de pago.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">Mis pagos</h2>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-700">{pagos.totalPendiente}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Por cobrar</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-700">{pagos.totalPagado}</p>
          <p className="text-xs text-green-600 mt-0.5">Ya cobrado</p>
        </div>
      </div>

      {/* Pendientes de cobro */}
      {hayPendientes && (
        <div>
          <button
            onClick={() => setShowPendientes((v) => !v)}
            className="w-full flex items-center justify-between py-2 text-sm font-medium text-foreground hover:text-brand-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Por cobrar ({pagos.pendientes.length} juego{pagos.pendientes.length !== 1 ? "s" : ""})
            </span>
            {showPendientes
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>

          {showPendientes && (
            <div className="mt-2 space-y-2">
              {pagos.pendientes.map((j) => (
                <div
                  key={j.gameId}
                  className="flex items-center justify-between py-2.5 px-3 bg-yellow-50 border border-yellow-100 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {j.homeTeam} vs {j.awayTeam}
                    </p>
                    <p className="text-xs text-muted-foreground">{j.sport} · {j.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-yellow-700">{j.monto}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider si hay ambos */}
      {hayPendientes && hayPagados && (
        <div className="border-t border-border/50" />
      )}

      {/* Pagados */}
      {hayPagados && (
        <div>
          <button
            onClick={() => setShowPagados((v) => !v)}
            className="w-full flex items-center justify-between py-2 text-sm font-medium text-foreground hover:text-brand-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Pagados ({pagos.pagados.length} juego{pagos.pagados.length !== 1 ? "s" : ""})
            </span>
            {showPagados
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>

          {showPagados && (
            <div className="mt-2 space-y-2">
              {pagos.pagados.map((j) => (
                <div
                  key={j.gameId}
                  className="flex items-center justify-between py-2.5 px-3 bg-green-50 border border-green-100 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {j.homeTeam} vs {j.awayTeam}
                    </p>
                    <p className="text-xs text-muted-foreground">{j.sport} · {j.date}</p>
                    {j.pagoFecha && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <Receipt className="w-3 h-3" />
                        Pagado el {j.pagoFecha}
                        {j.pagoRecibo && ` · Recibo #${j.pagoRecibo}`}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-green-700">{j.monto}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
