import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gamepad2,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { FinancialSummary } from "@/actions/reports";

interface FinancialCardsProps {
  summary: FinancialSummary;
}

export function FinancialCards({ summary }: FinancialCardsProps) {
  const profitPositive = summary.netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Ingresos */}
      <FinancialCard
        label="Ingresos"
        value={formatCurrency(summary.totalIncome)}
        subtitle={`${summary.finishedGames} juego${summary.finishedGames !== 1 ? "s" : ""} finalizado${summary.finishedGames !== 1 ? "s" : ""}`}
        icon={TrendingUp}
        color="green"
      />

      {/* Egresos */}
      <FinancialCard
        label="Egresos (pagos árbitros)"
        value={formatCurrency(summary.totalExpenses)}
        subtitle={`${summary.pendingPayments} planilla${summary.pendingPayments !== 1 ? "s" : ""} aprobada${summary.pendingPayments !== 1 ? "s" : ""}`}
        icon={TrendingDown}
        color="red"
      />

      {/* Ganancia neta */}
      <FinancialCard
        label="Ganancia neta"
        value={formatCurrency(summary.netProfit)}
        subtitle={
          summary.totalIncome > 0
            ? `Margen: ${Math.round((summary.netProfit / summary.totalIncome) * 100)}%`
            : "Sin ingresos en el período"
        }
        icon={DollarSign}
        color={profitPositive ? "brand" : "red"}
      />

      {/* Juegos del período */}
      <FinancialCard
        label="Juegos programados"
        value={String(summary.totalGames)}
        subtitle={`${summary.finishedGames} finalizado${summary.finishedGames !== 1 ? "s" : ""}`}
        icon={Gamepad2}
        color="blue"
      />

      {/* Planillas aprobadas */}
      <FinancialCard
        label="Pagos pendientes"
        value={formatCurrency(summary.pendingPaymentAmount)}
        subtitle={`${summary.pendingPayments} pago${summary.pendingPayments !== 1 ? "s" : ""} por realizar`}
        icon={Clock}
        color={summary.pendingPayments > 0 ? "yellow" : "green"}
      />
    </div>
  );
}

// ─── Card individual ─────────────────────────────────────────────────────────

function FinancialCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: "green" | "red" | "brand" | "blue" | "yellow" | "gray";
}) {
  const iconColors = {
    green:  "bg-green-100 text-green-600",
    red:    "bg-red-100 text-red-600",
    brand:  "bg-brand-100 text-brand-600",
    blue:   "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray:   "bg-muted text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        </div>
        <div className={cn("p-2.5 rounded-lg flex-shrink-0", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
