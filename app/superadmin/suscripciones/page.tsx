import { prisma } from "@/lib/prisma";
import { CreditCard } from "lucide-react";

export const metadata = { title: "SuperAdmin · Suscripciones" };

const STATUS_LABELS: Record<string, string> = {
  TRIAL:   "Prueba",
  ACTIVE:  "Activa",
  EXPIRED: "Expirada",
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL:   "bg-yellow-100 text-yellow-700",
  ACTIVE:  "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};

export default async function SuscripcionesPage() {
  const academies = await prisma.academy.findMany({
    orderBy: { name: "asc" },
    include: { subscription: true },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>
        <p className="text-sm text-muted-foreground mt-1">Estado de suscripción por academia</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Academia</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trial hasta</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Suscripción hasta</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Último pago</th>
            </tr>
          </thead>
          <tbody>
            {academies.map((a) => {
              const sub = a.subscription;
              return (
                <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3">
                    {sub ? (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[sub.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[sub.status] ?? sub.status}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin plan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {sub?.trialEndsAt
                      ? sub.trialEndsAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {sub?.subscriptionEndsAt
                      ? sub.subscriptionEndsAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {sub?.lastPaymentAt
                      ? sub.lastPaymentAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
