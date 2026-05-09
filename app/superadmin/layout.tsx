import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Users, CreditCard, BarChart3, LogOut, Shield, Settings } from "lucide-react";

const SUPERADMIN_EMAIL = "johancamilobe@gmail.com";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });

  const fullName = dbUser
    ? `${dbUser.firstName ?? ""} ${dbUser.lastName ?? ""}`.trim() || dbUser.name || "SuperAdmin"
    : "SuperAdmin";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const navItems = [
    { href: "/superadmin",               icon: BarChart3,  label: "Dashboard" },
    { href: "/superadmin/academias",     icon: Building2,  label: "Academias" },
    { href: "/superadmin/usuarios",      icon: Users,      label: "Usuarios" },
    { href: "/superadmin/suscripciones", icon: CreditCard, label: "Suscripciones" },
    { href: "/superadmin/perfil",        icon: Settings,   label: "Mi perfil" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-5 flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">ArbiFy360</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Usuario */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{SUPERADMIN_EMAIL}</p>
            </div>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
