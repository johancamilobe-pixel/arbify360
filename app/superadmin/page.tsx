import { prisma } from "@/lib/prisma";
import { Building2, Users, CreditCard, Calendar } from "lucide-react";

export const metadata = { title: "SuperAdmin · Dashboard" };

export default async function SuperAdminDashboard() {
  const [
    totalAcademies,
    activeAcademies,
    totalUsers,
    totalGames,
    totalReferees,
    recentAcademies,
  ] = await Promise.all([
    prisma.academy.count(),
    prisma.academy.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.game.count(),
    prisma.academyMembership.count({ where: { role: "REFEREE" } }),
    prisma.academy.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, isActive: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Academias", value: totalAcademies, sub: `${activeAcademies} activas`, icon: Building2, color: "bg-brand-100 text-brand-600" },
    { label: "Usuarios",  value: totalUsers,     sub: `${totalReferees} árbitros`,   icon: Users,     color: "bg-blue-100 text-blue-600" },
    { label: "Juegos",    value: totalGames,     sub: "total creados",               icon: Calendar,  color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Panel de control global de ArbiFy360</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label} · {s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Últimas academias */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Últimas academias registradas</h2>
        <div className="space-y-3">
          {recentAcademies.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="font-medium text-foreground text-sm">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {a.isActive ? "Activa" : "Inactiva"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
