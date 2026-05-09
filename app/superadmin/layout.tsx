import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Building2, Users, CreditCard, BarChart3, LogOut, Shield } from "lucide-react";

const SUPERADMIN_EMAIL = "johancamilobe@gmail.com";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== SUPERADMIN_EMAIL) {
    redirect("/sign-in");
  }

  const navItems = [
    { href: "/superadmin",              icon: BarChart3,   label: "Dashboard" },
    { href: "/superadmin/academias",    icon: Building2,   label: "Academias" },
    { href: "/superadmin/usuarios",     icon: Users,       label: "Usuarios" },
    { href: "/superadmin/suscripciones", icon: CreditCard, label: "Suscripciones" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">ArbiFy360</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>

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

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
