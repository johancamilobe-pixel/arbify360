"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface Props {
  academyId:    string;
  academyName:  string;
  role:         "ADMIN" | "REFEREE";
  userAcademies: {
    academyId:    string;
    academyName:  string;
    academyLogo:  string | null;
    role:         "ADMIN" | "REFEREE";
  }[];
  children: React.ReactNode;
}

export function MobileLayout({ academyId, academyName, role, userAcademies, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el sidebar al navegar
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Cierra al hacer Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex h-full w-full">

      {/* ── Sidebar desktop (siempre visible) ── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          academyId={academyId}
          academyName={academyName}
          role={role}
          userAcademies={userAcademies}
        />
      </div>

      {/* ── Sidebar móvil (overlay) ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
            <Sidebar
              academyId={academyId}
              academyName={academyName}
              role={role}
              userAcademies={userAcademies}
            />
          </div>
        </>
      )}

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          academyName={academyName}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
