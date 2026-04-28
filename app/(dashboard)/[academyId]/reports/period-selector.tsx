"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodSelectorProps {
  academyId: string;
  currentStart: string; // ISO string
  currentEnd: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function PeriodSelector({ academyId, currentStart, currentEnd }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(currentStart.slice(0, 10));
  const [customEnd, setCustomEnd] = useState(currentEnd.slice(0, 10));

  const startDate = new Date(currentStart);
  const currentMonthLabel = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`;

  function navigateMonth(direction: "prev" | "next") {
    const d = new Date(currentStart);
    if (direction === "prev") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }

    const newStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const newEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const params = new URLSearchParams();
    params.set("from", newStart.toISOString());
    params.set("to", newEnd.toISOString());
    router.push(`/${academyId}/reports?${params.toString()}`);
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return;

    const from = new Date(customStart + "T00:00:00");
    const to = new Date(customEnd + "T23:59:59");

    if (to < from) return;

    const params = new URLSearchParams();
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());
    router.push(`/${academyId}/reports?${params.toString()}`);
    setShowCustom(false);
  }

  function goToCurrentMonth() {
    router.push(`/${academyId}/reports`);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Navegación por mes */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-1 py-1">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground/80 transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={goToCurrentMonth}
          className="px-3 py-1 text-sm font-medium text-foreground/80 hover:text-brand-600 transition-colors min-w-[140px] text-center"
        >
          {currentMonthLabel}
        </button>

        <button
          onClick={() => navigateMonth("next")}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground/80 transition-colors"
          title="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle rango personalizado */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors",
          showCustom
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-gray-300"
        )}
      >
        <CalendarDays className="w-4 h-4" />
        Rango personalizado
      </button>

      {/* Rango personalizado expandido */}
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <span className="text-sm text-muted-foreground/70">a</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button
            onClick={applyCustomRange}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
