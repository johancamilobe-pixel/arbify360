import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, getInitials, cn } from "@/lib/utils";
import { Plus, Users, Upload } from "lucide-react";
import { RefereeSearch } from "./referee-search";

interface Props {
  params: { academyId: string };
  searchParams: { inactive?: string; q?: string };
}

export const metadata = { title: "Árbitros" };

export default async function RefereesPage({ params, searchParams }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const showInactive = searchParams.inactive === "1";

  const memberships = await prisma.academyMembership.findMany({
    where: {
      academyId,
      role: "REFEREE",
      isActive: showInactive ? false : true,
    },
    include: {
      user: true,
      refereeCategory: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  // Serializar para el client component
  const referees = memberships.map((m) => ({
    userId:        m.userId,
    name:          m.user.name,
    photoUrl:      m.user.photoUrl ?? null,
    phone:         m.user.phone ?? null,
    licenseNumber: m.user.licenseNumber ?? null,
    categoryName:  m.refereeCategory?.name ?? null,
    ratePerGame:   m.refereeCategory?.ratePerGame?.toString() ?? null,
    isActive:      m.isActive,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Árbitros</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {memberships.length} árbitro{memberships.length !== 1 ? "s" : ""}{" "}
            {showInactive ? "inactivos" : "activos"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${academyId}/referees/import`}
            className="flex items-center gap-2 bg-card border border-border hover:bg-background text-foreground/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </Link>
          <Link
            href={`/${academyId}/referees/new`}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar árbitro
          </Link>
        </div>
      </div>

      {/* Tabs activos/inactivos */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/${academyId}/referees`}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            !showInactive
              ? "bg-brand-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
        >
          Activos
        </Link>
        <Link
          href={`/${academyId}/referees?inactive=1`}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showInactive
              ? "bg-brand-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
        >
          Inactivos
        </Link>
      </div>

      {/* Buscador + lista */}
      {memberships.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {showInactive ? "No hay árbitros inactivos" : "No hay árbitros registrados"}
          </p>
          {!showInactive && (
            <Link
              href={`/${academyId}/referees/new`}
              className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Agregar el primer árbitro →
            </Link>
          )}
        </div>
      ) : (
        <RefereeSearch academyId={academyId} referees={referees} />
      )}
    </div>
  );
}