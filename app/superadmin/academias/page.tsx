import { prisma } from "@/lib/prisma";
import { Building2 } from "lucide-react";
import { AcademiasList } from "./academias-list";

export const metadata = { title: "SuperAdmin · Academias" };

export default async function AcademiasPage() {
  const academies = await prisma.academy.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: true,
          games: true,
        },
      },
      subscription: true,
    },
  });

  const data = academies.map((a) => ({
    id:          a.id,
    name:        a.name,
    logoUrl:     a.logoUrl,
    isActive:    a.isActive,
    createdAt:   a.createdAt.toISOString(),
    members:     a._count.memberships,
    games:       a._count.games,
    subStatus:   a.subscription?.status ?? "SIN PLAN",
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Academias</h1>
        <p className="text-sm text-muted-foreground mt-1">{academies.length} academias registradas</p>
      </div>

      {academies.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Building2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay academias registradas</p>
        </div>
      ) : (
        <AcademiasList academies={data} />
      )}
    </div>
  );
}
