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
  Wallet,
  Shield,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AcademySwitcher } from "./academy-switcher";

interface SidebarProps {
  academyId: string;
  academyName: string;
  academyLogo:  string | null;
  role: "ADMIN" | "REFEREE";
  userName: string;
  userAcademies: {
    academyId: string;
    academyName: string;
    academyLogo: string | null;
    role: "ADMIN" | "REFEREE";
  }[];
}

function getNavItems(academyId: string, role: "ADMIN" | "REFEREE") {
  const base = `/${academyId}`;
  const all = [
    { label: "Inicio",        href: base,                    icon: Home,          roles: ["ADMIN", "REFEREE"], exact: true },
    { label: "Juegos",        href: `${base}/games`,         icon: Calendar,      roles: ["ADMIN", "REFEREE"] },
    { label: "Torneos",       href: `${base}/tournaments`,   icon: Trophy,        roles: ["ADMIN"] },
    { label: "Planillas",     href: `${base}/scoresheets`,   icon: ClipboardList, roles: ["ADMIN", "REFEREE"] },
    { label: "Disponibilidad",href: `${base}/availability`,  icon: Calendar,      roles: ["ADMIN", "REFEREE"] },
    { label: "Asistencia",    href: `${base}/attendance`,    icon: ClipboardCheck,roles: ["ADMIN", "REFEREE"] },
    { label: "Árbitros",      href: `${base}/referees`,      icon: Users,         roles: ["ADMIN"] },
    { label: "Pagos",         href: `${base}/payments`,      icon: Wallet,        roles: ["ADMIN"] },
    { label: "Mis pagos",     href: `${base}/my-payments`,   icon: Wallet,        roles: ["REFEREE"] },
    { label: "Reportes",      href: `${base}/reports`,       icon: BarChart3,     roles: ["ADMIN"] },
    { label: "Configuración", href: `${base}/settings`,      icon: Settings,      roles: ["ADMIN"] },
    { label: "Mi perfil",     href: `${base}/profile`,       icon: User,          roles: ["ADMIN", "REFEREE"] },
    { label: "Suscripción",   href: `${base}/subscription`,  icon: Shield,        roles: ["ADMIN", "REFEREE"] },
  ];
  return all.filter((item) => item.roles.includes(role));
}

export function Sidebar({ academyId, academyName, academyLogo, role, userName, userAcademies }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(academyId, role);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // Iniciales para el avatar
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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

      {/* Usuario + rol */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {/* Avatar con iniciales */}
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-400">{initials}</span>
          </div>
          {/* Nombre + rol */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className={cn(
              "text-xs font-medium",
              role === "ADMIN" ? "text-brand-400" : "text-white/40"
            )}>
              {role === "ADMIN" ? "Administrador" : "Árbitro"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
