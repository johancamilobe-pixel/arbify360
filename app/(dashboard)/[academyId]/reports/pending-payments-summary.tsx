import { formatCurrency, getInitials, cn } from "@/lib/utils";
import type { RefereePendingPayment } from "@/actions/reports";

interface PendingPaymentsSummaryProps {
  payments: RefereePendingPayment[];
  academyId: string;
}

export function PendingPaymentsSummary({ payments, academyId }: PendingPaymentsSummaryProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground/70">No hay pagos pendientes en este período</p>
      </div>
    );
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalGames = payments.reduce((sum, p) => sum + p.approvedGames, 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pagos pendientes por árbitro
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {payments.length} árbitro{payments.length !== 1 ? "s" : ""} · {totalGames} juego{totalGames !== 1 ? "s" : ""} aprobado{totalGames !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground/70">Total a pagar</p>
          <p className="text-lg font-bold text-brand-600">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {payments.map((payment) => (
          <div key={payment.userId} className="px-5 py-3 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                {getInitials(payment.userName)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {payment.userName}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {payment.category && (
                  <span className="text-muted-foreground">{payment.category} · </span>
                )}
                {payment.approvedGames} juego{payment.approvedGames !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Monto */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(payment.totalAmount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
