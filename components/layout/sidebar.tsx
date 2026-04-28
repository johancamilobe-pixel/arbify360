"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  User,
  Home,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AcademySwitcher } from "./academy-switcher";

interface SidebarProps {
  academyId: string;
  academyName: string;
  role: "ADMIN" | "REFEREE";
  userAcademies: {
    academyId: string;
    academyName: string;
    academyLogo: string | null;
    role: "ADMIN" | "REFEREE";
  }[];
}

// Íconos y rutas de navegación
function getNavItems(academyId: string, role: "ADMIN" | "REFEREE") {
  const base = `/${academyId}`;
  const all = [
    {
      label: "Inicio",
      href: base,
      icon: Home,
      roles: ["ADMIN", "REFEREE"],
      exact: true,
    },
    {
      label: "Juegos",
      href: `${base}/games`,
      icon: Calendar,
      roles: ["ADMIN", "REFEREE"],
    },
    {
      label: "Planillas",
      href: `${base}/scoresheets`,
      icon: ClipboardList,
      roles: ["ADMIN", "REFEREE"],
    },
    {
      label: "Disponibilidad",
      href: `${base}/availability`,
      icon: Calendar,
      roles: ["ADMIN", "REFEREE"],
    },
    {
      label: "Asistencia",
      href: `${base}/attendance`,
      icon: ClipboardCheck,
      roles: ["ADMIN", "REFEREE"],
    },
    {
      label: "Árbitros",
      href: `${base}/referees`,
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      label: "Reportes",
      href: `${base}/reports`,
      icon: BarChart3,
      roles: ["ADMIN"],
    },
    {
      label: "Configuración",
      href: `${base}/settings`,
      icon: Settings,
      roles: ["ADMIN"],
    },
    {
      label: "Mi perfil",
      href: `${base}/profile`,
      icon: User,
      roles: ["ADMIN", "REFEREE"],
    },
  ];

  return all.filter((item) => item.roles.includes(role));
}

export function Sidebar({ academyId, academyName, role, userAcademies }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(academyId, role);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full w-64 bg-black text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-white">ArbiFy360</span>
      </div>

      {/* Academia activa + switcher */}
      <AcademySwitcher
        currentAcademyId={academyId}
        currentAcademyName={academyName}
        academies={userAcademies}
      />

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-500 text-white"
                      : "text-muted-foreground/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Badge de rol */}
      <div className="px-6 py-4 border-t border-white/10">
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          role === "ADMIN"
            ? "bg-brand-500/20 text-brand-400"
            : "bg-white/10 text-muted-foreground/70"
        )}>
          {role === "ADMIN" ? "Administrador" : "Árbitro"}
        </span>
      </div>
    </aside>
  );
}
