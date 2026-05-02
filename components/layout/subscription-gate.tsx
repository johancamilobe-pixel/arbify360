"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { generateWompiUrl } from "@/actions/wompi";

interface Props {
  academyId:   string;
  academyName: string;
  isAdmin:     boolean;
}

export function SubscriptionGate({ academyId, academyName, isAdmin }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const url = await generateWompiUrl(academyId);
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acceso suspendido</h1>
          <p className="text-muted-foreground mt-2">
            La suscripción de <strong>{academyName}</strong> ha vencido.
          </p>
        </div>

        {!isAdmin && (
          <div className="bg-muted rounded-xl p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Contacta al administrador de la academia para renovar la suscripción.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Una vez renovada, podrás acceder normalmente.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-foreground">Renovar suscripción</h2>
            </div>

            <div className="py-3 border-y border-border/50">
              <p className="text-sm font-medium text-foreground">Plan mensual ArbiFy360</p>
              <p className="text-xs text-muted-foreground mt-0.5">30 días de acceso completo</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-70"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo...</>
                  : <><CreditCard className="w-4 h-4" /> Pagar suscripción</>
                }
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                Pago seguro procesado por WOMPI
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CreditCard className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                Tarjetas, Nequi, PSE y Bancolombia
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
