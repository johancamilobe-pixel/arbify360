import { requireAdminRole } from "@/lib/auth";
import {
  getFinancialSummary,
  getGamesFinancialBreakdown,
  getPendingPaymentsByReferee,
} from "@/actions/reports";
import { PeriodSelector } from "./period-selector";
import { FinancialCards } from "./financial-cards";
import { GamesFinancialTable } from "./games-table";
import { PendingPaymentsSummary } from "./pending-payments-summary";

interface Props {
  params: { academyId: string };
  searchParams: { from?: string; to?: string };
}

export async function generateMetadata() {
  return { title: "Reportes financieros" };
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  // Determinar período: query params o mes actual
  const now = new Date();
  const startDate = searchParams.from
    ? new Date(searchParams.from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = searchParams.to
    ? new Date(searchParams.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fetch paralelo de datos
  const [summary, games, pendingPayments] = await Promise.all([
    getFinancialSummary(academyId, startDate, endDate),
    getGamesFinancialBreakdown(academyId, startDate, endDate),
    getPendingPaymentsByReferee(academyId, startDate, endDate),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Reportes financieros
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de ingresos, egresos y pagos de la academia
        </p>
      </div>

      {/* Selector de período */}
      <div className="mb-6">
        <PeriodSelector
          academyId={academyId}
          currentStart={startDate.toISOString()}
          currentEnd={endDate.toISOString()}
        />
      </div>

      {/* Tarjetas de resumen */}
      <div className="mb-8">
        <FinancialCards summary={summary} />
      </div>

      {/* Tabla de juegos */}
      <div className="mb-6">
        <GamesFinancialTable games={games} academyId={academyId} />
      </div>

      {/* Pagos pendientes por árbitro */}
      <PendingPaymentsSummary payments={pendingPayments} academyId={academyId} />
    </div>
  );
}
