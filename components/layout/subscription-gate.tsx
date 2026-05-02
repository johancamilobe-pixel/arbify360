"use client";

import { Shield, AlertTriangle, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";

interface Props {
  academyId:      string;
  academyName:    string;
  isAdmin:        boolean;
  wompiPublicKey: string;
  amount:         number;
}

export function SubscriptionGate({
  academyId,
  academyName,
  isAdmin,
  wompiPublicKey,
  amount,
}: Props) {
  const reference = `${academyId}-${Date.now()}`;
  const redirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${academyId}`
    : `https://arbify360-sandbox.vercel.app/${academyId}`;

  const wompiUrl = [
    `https://checkout.wompi.io/p/`,
    `?public-key=${wompiPublicKey}`,
    `&currency=COP`,
    `&amount-in-cents=${amount}`,
    `&reference=${reference}`,
    `&redirect-url=${encodeURIComponent(redirectUrl)}`,
  ].join("");

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
              <a
                href={wompiUrl}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Pagar suscripción
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

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
