"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

interface Academy {
  academyId: string;
  academyName: string;
  academyLogo: string | null;
  role: "ADMIN" | "REFEREE";
}

interface Props {
  currentAcademyId: string;
  currentAcademyName: string;
  academies: Academy[];
}

export function AcademySwitcher({ currentAcademyId, currentAcademyName, academies }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Si solo tiene una academia, no hay nada que cambiar
  if (academies.length <= 1) {
    return (
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Academia</p>
        <p className="text-white font-medium text-sm truncate">{currentAcademyName}</p>
      </div>
    );
  }

  const handleSwitch = (academyId: string) => {
    setOpen(false);
    router.push(`/${academyId}`);
  };

  return (
    <div className="relative border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Academia</p>
          <p className="text-white font-medium text-sm truncate">{currentAcademyName}</p>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground/70 flex-shrink-0 transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay para cerrar al hacer click afuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 bg-gray-900 border border-white/10 rounded-b-lg shadow-xl overflow-hidden">
            {academies.map((academy) => (
              <button
                key={academy.academyId}
                onClick={() => handleSwitch(academy.academyId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-md bg-brand-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {academy.academyLogo ? (
                    <img
                      src={academy.academyLogo}
                      alt={academy.academyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-brand-400 font-bold text-xs">
                      {getInitials(academy.academyName)}
                    </span>
                  )}
                </div>

                <span className="flex-1 text-sm text-muted-foreground/50 truncate">
                  {academy.academyName}
                </span>

                {academy.academyId === currentAcademyId && (
                  <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
