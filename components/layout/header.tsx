"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

interface HeaderProps {
  academyName: string;
  pageTitle?: string;
  onMenuClick?: () => void; // Para mobile sidebar toggle
}

export function Header({ academyName, pageTitle, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Título de la página */}
        {pageTitle && (
          <h1 className="text-foreground font-semibold">{pageTitle}</h1>
        )}
      </div>

      {/* Acciones del header */}
      <div className="flex items-center gap-4">
        {/* Nombre de academia visible en mobile */}
        <span className="lg:hidden text-sm text-muted-foreground truncate max-w-32">
          {academyName}
        </span>

        {/* Avatar + menú de Clerk */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "shadow-lg border border-border",
            },
          }}
        />
      </div>
    </header>
  );
}
