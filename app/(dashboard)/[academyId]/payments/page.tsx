import { requireAdminRole } from "@/lib/auth";
import { getPayments, getIncomes, getPendingPayments } from "@/actions/payments";
import { PaymentsTabs } from "./payments-tabs";

interface Props {
  params: { academyId: string };
  searchParams: {
    from?: string;
    to?: string;
    tab?: string;
    period?: string;
  };
}

export async function generateMetadata() {
  return { title: "Pagos" };
}

export default async function PaymentsPage({ params, searchParams }: Props) {
  const academyId = params.academyId;
  await requireAdminRole(academyId);

  const now = new Date();
  const startDate = searchParams.from
    ? new Date(searchParams.from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = searchParams.to
    ? new Date(searchParams.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const periodType = (searchParams.period as any) || "MONTHLY";

  let payments, incomes, pendingGroups;
  try {
    [payments, incomes, pendingGroups] = await Promise.all([
      getPayments(academyId, startDate, endDate),
      getIncomes(academyId, startDate, endDate),
      getPendingPayments(academyId, periodType),
    ]);
  } catch (error) {
    console.error("Error loading payments data:", error);
    payments = [];
    incomes = [];
    pendingGroups = [];
  }

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalPending = pendingGroups.reduce((sum, g) => sum + g.totalAmount, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de egresos a árbitros e ingresos de equipos/ligas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Pendiente por pagar
          </p>
          <p className="text-xl font-bold text-orange-600 mt-1">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(totalPending)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingGroups.length} árbitro
            {pendingGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Pagado este período
          </p>
          <p className="text-xl font-bold text-red-600 mt-1">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(totalPaid)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payments.filter((p) => p.status === "COMPLETED").length} pago
            {payments.filter((p) => p.status === "COMPLETED").length !== 1
              ? "s"
              : ""}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-medium">
            Ingresos recibidos
          </p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(totalIncome)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {incomes.length} registro{incomes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <PaymentsTabs
        academyId={academyId}
        payments={payments}
        incomes={incomes}
        pendingGroups={pendingGroups}
        currentPeriod={periodType}
        currentTab={searchParams.tab || "pending"}
      />
    </div>
  );
}