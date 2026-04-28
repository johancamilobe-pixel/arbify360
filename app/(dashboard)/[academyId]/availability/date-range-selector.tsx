"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  academyId:    string;
  currentFrom:  string; // YYYY-MM-DD
  currentTo:    string;
}

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function DateRangeSelector({ academyId, currentFrom, currentTo }: Props) {
  const router = useRouter();
  const fromDate = new Date(currentFrom + "T00:00:00");
  const label = `${MONTHS_ES[fromDate.getMonth()]} ${fromDate.getFullYear()}`;

  function navigateMonth(direction: "prev" | "next") {
    const d = new Date(currentFrom + "T00:00:00");
    if (direction === "prev") d.setMonth(d.getMonth() - 1);
    else d.setMonth(d.getMonth() + 1);

    const newFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const newTo   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    router.push(`/${academyId}/availability?from=${newFrom}&to=${newTo}`);
  }

  function goToCurrentMonth() {
    router.push(`/${academyId}/availability`);
  }

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-1 py-1">
      <button
        onClick={() => navigateMonth("prev")}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={goToCurrentMonth}
        className="px-3 py-1 text-sm font-medium text-foreground/80 hover:text-brand-600 transition-colors min-w-[140px] text-center"
      >
        {label}
      </button>

      <button
        onClick={() => navigateMonth("next")}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
