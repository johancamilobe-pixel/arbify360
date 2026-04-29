"use client";

import { useState } from "react";
import { Clock, CheckCircle2, FileX, Receipt, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Juego {
  gameId:           string;
  homeTeam:         string;
  awayTeam:         string;
  sport:            string;
  category:         string;
  date:             string;
  subStatus:        string | null;
  monto:            string | null;
  pagado:           boolean;
  paymentId:        string | null;
  pagoFecha:        string | null;
  pagoRecibo:       string | null;
  pagoMetodo?:      string | null;
  pagoMetodoLabel?: string | null;
}

interface Props {
  pagos: {
    pendientes:     Juego[];
    pagados:        Juego[];
    sinPlanilla:    Juego[];
    totalPendiente: string;
    totalPagado:    string;
    totalJuegos:    number;
  };
  academyId: string;
}

type Tab = "pendientes" | "pagados" | "sinPlanilla";

export function RefereePagosDetalle({ pagos, academyId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("pendientes");

  const tabs = [
    { id: "pendientes" as Tab,   label: "Por cobrar",   count: pagos.pendientes.length,  icon: Clock,        color: "text-orange-600" },
    { id: "pagados" as Tab,      label: "Pagados",      count: pagos.pagados.length,     icon: CheckCircle2, color: "text-green-600" },
    { id: "sinPlanilla" as Tab,  label: "Sin planilla", count: pagos.sinPlanilla.length, icon: FileX,        color: "text-muted-foreground" },
  ];

  const current = pagos[activeTab];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-brand-500 text-brand-600 bg-brand-50/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "")} />
            {tab.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-medium",
              activeTab === tab.id ? "bg-brand-100 text-brand-700" : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {current.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground/70">
              {activeTab === "pendientes"  && "No tienes juegos pendientes de cobro."}
              {activeTab === "pagados"     && "Aún no tienes pagos registrados."}
              {activeTab === "sinPlanilla" && "Todos tus juegos tienen planilla subida."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {current.map((j) => (
              <div
                key={j.gameId}
                className={cn(
                  "rounded-lg border p-3.5",
                  activeTab === "pendientes"  && "bg-orange-50 border-orange-100",
                  activeTab === "pagados"     && "bg-green-50 border-green-100",
                  activeTab === "sinPlanilla" && "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {j.homeTeam} <span className="font-normal text-muted-foreground">vs</span> {j.awayTeam}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.sport} · {j.category} · {j.date}
                    </p>

                    {activeTab === "pagados" && j.pagoFecha && (
                      <p className="text-xs text-green-700 flex items-center gap-1 mt-1">
                        <Receipt className="w-3 h-3" />
                        Pagado el {j.pagoFecha}
                        {j.pagoMetodoLabel && ` · ${j.pagoMetodoLabel}`}
                        {j.pagoRecibo && ` · Recibo #${j.pagoRecibo}`}
                      </p>
                    )}

                    {activeTab === "sinPlanilla" && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {j.subStatus === "REJECTED"
                          ? "Planilla rechazada — debes volver a subir"
                          : "Aún no has subido la planilla"}
                      </p>
                    )}

                    {/* Link ver recibo — solo pagados con paymentId */}
                    {activeTab === "pagados" && j.paymentId && (
                      <Link
                        href={`/${academyId}/my-payments/receipt/${j.paymentId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors mt-2 border border-brand-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver recibo
                      </Link>
                    )}
                  </div>

                  {j.monto && (
                    <span className={cn(
                      "text-sm font-bold flex-shrink-0",
                      activeTab === "pendientes"  && "text-orange-700",
                      activeTab === "pagados"     && "text-green-700",
                      activeTab === "sinPlanilla" && "text-muted-foreground"
                    )}>
                      {j.monto}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
