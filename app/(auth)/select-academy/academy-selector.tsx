"use client";

import { useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";

interface Academy {
  academyId: string;
  academyName: string;
  academyLogo: string | null;
  role: "ADMIN" | "REFEREE";
}

const ROLE_LABELS = {
  ADMIN:   "Administrador",
  REFEREE: "Árbitro",
};

export default function AcademySelector({ academies }: { academies: Academy[] }) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {academies.map((academy) => (
        <button
          key={academy.academyId}
          onClick={() => router.push(`/${academy.academyId}`)}
          className={cn(
            "w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border",
            "hover:border-brand-400 hover:shadow-sm transition-all text-left group"
          )}
        >
          {/* Avatar de academia */}
          <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {academy.academyLogo ? (
              <img
                src={academy.academyLogo}
                alt={academy.academyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-brand-600 font-bold text-lg">
                {getInitials(academy.academyName)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate group-hover:text-brand-600 transition-colors">
              {academy.academyName}
            </p>
            <p className="text-sm text-muted-foreground">{ROLE_LABELS[academy.role]}</p>
          </div>

          {/* Flecha */}
          <span className="text-muted-foreground/50 group-hover:text-brand-500 transition-colors">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
