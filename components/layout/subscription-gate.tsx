"use client";

import { useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";

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
  const redirectUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${academyId}/subscription`;

  useEffect(() => {
    // Cargar script WOMPI si es admin
    if (!isAdmin) return;
    if (document.getElementById("wompi-script")) return;
    const script = document.createElement("script");
    script.id = "wompi-script";
    script.src = "https://checkout.wompi.io/widget.js";
    script.setAttribute("data-render", "false");
    document.body.appendChild(script);
  }, [isAdmin]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        {/* Ícono */}
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acceso suspendido</h1>
          <p className="text-muted-foreground mt-2">
            La suscripción de <strong>{academyName}</strong> ha vencido.
          </p>
        </div>

        {/* Mensaje árbitro */}
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

        {/* Panel de pago — admin */}
        {isAdmin && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-foreground">Renovar suscripción</h2>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Plan mensual ArbiFy360</p>
                <p className="text-xs text-muted-foreground mt-0.5">30 días de acceso completo</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">$10.000</p>
                <p className="text-xs text-muted-foreground">COP</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Botón WOMPI */}
              <form>
                <script
                  src="https://checkout.wompi.io/widget.js"
                  data-render="button"
                  data-public-key={wompiPublicKey}
                  data-currency="COP"
                  data-amount-in-cents={amount.toString()}
                  data-reference={reference}
                  data-redirect-url={redirectUrl}
                />
              </form>

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
