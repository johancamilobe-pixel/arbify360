"use client";

import { Menu, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface HeaderProps {
  academyName: string;
  pageTitle?: string;
  onMenuClick?: () => void;
}

export function Header({ academyName, pageTitle, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h1 className="text-foreground font-semibold">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="lg:hidden text-sm text-muted-foreground truncate max-w-32">
          {academyName}
        </span>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}