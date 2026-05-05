import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RefereeCategoriesPanel } from "./referee-categories-panel";
import { GameCategoriesPanel } from "./game-categories-panel";
import { GamePhasesPanel } from "./game-phases-panel";
import { SportsToggle } from "./sports-toggle";
import { AcademyInfoPanel } from "./academy-info-panel";
import { Settings, Users, Calendar, Dumbbell, Building2, Flag } from "lucide-react";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Configuración" };

export default async function SettingsPage({ params }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const [academy, refereeCategories, gameCategories, gamePhases, allSports, academySports] = await Promise.all([
    prisma.academy.findUnique({ where: { id: academyId } }),
    prisma.refereeCategory.findMany({
      where: { academyId },
      orderBy: { name: "asc" },
      include: { _count: { select: { memberships: true } } },
    }),
    prisma.gameCategory.findMany({
      where: { academyId },
      orderBy: { name: "asc" },
      include: { _count: { select: { games: true } } },
    }),
    prisma.gamePhase.findMany({
      where: { academyId },
      orderBy: { name: "asc" },
      include: { _count: { select: { games: true } } },
    }),
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
    prisma.academySport.findMany({ where: { academyId } }),
  ]);

  if (!academy) return null;

  const activeSportIds = new Set(academySports.map((s) => s.sportId));

  const sports = allSports.map((s) => ({
    id:     s.id,
    name:   s.name,
    active: activeSportIds.has(s.id),
  }));

  const refCats = refereeCategories.map((c) => ({
    id:          c.id,
    name:        c.name,
    ratePerGame: c.ratePerGame?.toString() ?? null,
    count:       c._count.memberships,
  }));

  const gameCats = gameCategories.map((c) => ({
    id:            c.id,
    name:          c.name,
    incomePerGame: c.incomePerGame?.toString() ?? null,
    count:         c._count.games,
  }));

  const phases = gamePhases.map((p) => ({
    id:    p.id,
    name:  p.name,
    count: p._count.games,
  }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">Personaliza tu academia</p>
        </div>
      </div>

      {/* Datos de la academia */}
      <Section icon={<Building2 className="w-4 h-4" />} title="Datos de la academia">
        <AcademyInfoPanel
  academyId={academyId}
  academyName={academy.name}
  logoUrl={academy.logoUrl ?? null}
/>
      </Section>

      {/* Categorías de árbitros */}
      <Section
        icon={<Users className="w-4 h-4" />}
        title="Categorías de árbitros"
        description="Niveles internos: Junior, Senior, Semisenior, etc."
      >
        <RefereeCategoriesPanel academyId={academyId} categories={refCats} />
      </Section>

      {/* Categorías de juego */}
      <Section
        icon={<Calendar className="w-4 h-4" />}
        title="Categorías de juego"
        description="Tipos de juego y su ingreso base: Juvenil, Élite, Sub-17, etc."
      >
        <GameCategoriesPanel academyId={academyId} categories={gameCats} />
      </Section>

      {/* Fases de juego */}
      <Section
        icon={<Flag className="w-4 h-4" />}
        title="Fases de juego"
        description="Etapas del torneo: Fase de grupos, Eliminatoria, Cuartos, Semifinal, Final, Amistoso, etc."
      >
        <GamePhasesPanel academyId={academyId} phases={phases} />
      </Section>

      {/* Deportes */}
      <Section
        icon={<Dumbbell className="w-4 h-4" />}
        title="Deportes activos"
        description="Activa los deportes que maneja tu academia"
      >
        {allSports.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">
            No hay deportes en el catálogo. Contacta al super administrador.
          </p>
        ) : (
          <SportsToggle academyId={academyId} sports={sports} />
        )}
      </Section>
    </div>
  );
}

function Section({
  icon, title, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-brand-500">{icon}</span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
