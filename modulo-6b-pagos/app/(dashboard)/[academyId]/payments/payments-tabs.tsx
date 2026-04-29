"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PendingPaymentsList } from "./pending-payments-list";
import { PaymentsHistory } from "./payments-history";
import { IncomesList } from "./incomes-list";
import type { PaymentRecord, IncomeRecord, RefereePendingGroup } from "@/actions/payments";

interface Props {
  academyId: string;
  payments: PaymentRecord[];
  incomes: IncomeRecord[];
  pendingGroups: RefereePendingGroup[];
  currentPeriod: string;
  currentTab: string;
}

const TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "history", label: "Historial de pagos" },
  { id: "income", label: "Ingresos" },
] as const;

const PERIODS = [
  { id: "DAILY", label: "Diario" },
  { id: "WEEKLY", label: "Semanal" },
  { id: "BIWEEKLY", label: "Quincenal" },
  { id: "MONTHLY", label: "Mensual" },
] as const;

export function PaymentsTabs({
  academyId,
  payments,
  incomes,
  pendingGroups,
  currentPeriod,
  currentTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(currentTab);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePeriodChange(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.set("tab", "pending");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.id === "pending" && pendingGroups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                {pendingGroups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === "pending" && (
        <div>
          {/* Selector de período */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Agrupar por:</span>
            <div className="flex gap-1 bg-muted/50 p-0.5 rounded-md">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                    currentPeriod === p.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <PendingPaymentsList
            academyId={academyId}
            groups={pendingGroups}
            periodType={currentPeriod}
          />
        </div>
      )}

      {activeTab === "history" && (
        <PaymentsHistory
          academyId={academyId}
          payments={payments}
        />
      )}

      {activeTab === "income" && (
        <IncomesList
          academyId={academyId}
          incomes={incomes}
        />
      )}
    </div>
  );
}
