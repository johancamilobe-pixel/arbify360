"use client";

import { useEffect, useRef } from "react";
import { Shield, CheckCircle2, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionState {
  status: "TRIAL" | "ACTIVE" | "EXPIRED";
  daysLeft: number;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  lastPaymentAt: string | null;
  canPay: boolean;
}

interface Props {
  academyId:      string;
  academyName:    string;
  isAdmin:        boolean;
  subscription:   SubscriptionState | null;
  wompiPublicKey: string;
  amount:         number;
}

const STATUS_CONFIG = {
  TRIAL:   { label: "Período de prueba",  color: "bg-blue-100 text-blue-700",   icon: Clock        },
  ACTIVE:  { label: "Suscripción activa", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  EXPIRED: { label: "Suscripción vencida",color: "bg-red-100 text-red-700",     icon: AlertTriangle},
};

export function SubscriptionView({
  academyId,
  academyName,
  isAdmin,
  subscription,
  wompiPublicKey,
  amount,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const status = subscription?.status ?? "EXPIRED";
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const reference = `${academyId}-${Date.now()}`;
  const redirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${academyId}`
    : `/${academyId}`;

  useEffect(() => {
    if (!isAdmin || !subscription?.canPay || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const form = document.createElement("form");
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.io/widget.js";
    script.setAttribute("data-render", "button");
    script.setAttribute("data-public-key", wompiPublicKey);
    script.setAttribute("data-currency", "COP");
    script.setAttribute("data-amount-in-cents", amount.toString());
    script.setAttribute("data-reference", reference);
    script.setAttribute("data-redirect-url", redirectUrl);

    form.appendChild(script);
    containerRef.current.appendChild(form);
  }, [isAdmin, subscription?.canPay, wompiPublicKey, amount, reference, redirectUrl]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suscripción</h1>
          <p className="text-sm text-muted-foreground">{academyName}</p>
        </div>
      </div>

      {/* Estado */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Estado actual</h2>
          <span className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full",
            config.color
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {status === "TRIAL" && subscription && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Días restantes de prueba</span>
              <span className="font-bold text-blue-600">{subscription.daysLeft} días</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min((subscription.daysLeft / 8) * 100, 100)}%` }} />
            </div>
            {subscription.trialEndsAt && (
              <p className="text-xs text-muted-foreground/70">
                Vence el {new Date(subscription.trialEndsAt).toLocaleDateString("es-CO", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>
        )}

        {status === "ACTIVE" && subscription && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Días restantes</span>
              <span className="font-bold text-green-600">{subscription.daysLeft} días</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min((subscription.daysLeft / 30) * 100, 100)}%` }} />
            </div>
            {subscription.subscriptionEndsAt && (
              <p className="text-xs text-muted-foreground/70">
                Vigente hasta el {new Date(subscription.subscriptionEndsAt).toLocaleDateString("es-CO", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
            {subscription.lastPaymentAt && (
              <p className="text-xs text-muted-foreground/70">
                Último pago: {new Date(subscription.lastPaymentAt).toLocaleDateString("es-CO", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>
        )}

        {status === "EXPIRED" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Tu suscripción ha vencido</p>
            <p className="text-sm text-red-600 mt-1">
              Realiza el pago para reactivar el acceso completo.
            </p>
          </div>
        )}
      </div>

      {/* Plan */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Plan mensual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">ArbiFy360 — Acceso completo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestión de árbitros, juegos, planillas, pagos y reportes
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">$10.000</p>
            <p className="text-xs text-muted-foreground">COP / mes</p>
          </div>
        </div>
      </div>

      {/* Pago — solo admin */}
      {isAdmin && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Realizar pago</h2>

          {!subscription?.canPay ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Pago realizado</p>
                <p className="text-xs text-green-600 mt-0.5">
                  El botón se habilitará cuando sea necesario renovar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Al hacer clic se abrirá el checkout seguro de WOMPI.
              </p>
              <div ref={containerRef} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <CreditCard className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                Tarjetas, Nequi, PSE y Bancolombia
              </div>
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="bg-muted rounded-xl p-5 text-center">
          <p className="text-sm text-muted-foreground">
            El pago de la suscripción lo gestiona el administrador de la academia.
          </p>
        </div>
      )}
    </div>
  );
}
