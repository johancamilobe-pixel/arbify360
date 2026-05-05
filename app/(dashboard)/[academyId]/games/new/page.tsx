import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GameForm } from "../game-form";

interface Props {
  params:       { academyId: string };
  searchParams: { tournamentId?: string };
}

export const metadata = { title: "Nuevo juego" };

export default async function NewGamePage({ params, searchParams }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const [sports, categories, phases, tournaments, referees] = await Promise.all([
    prisma.academySport.findMany({
      where: { academyId },
      include: { sport: true },
    }),
    prisma.gameCategory.findMany({
      where: { academyId },
      orderBy: { name: "asc" },
    }),
    prisma.gamePhase.findMany({
      where: { academyId },
      orderBy: { name: "asc" },
    }),
    prisma.tournament.findMany({
      where: { academyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.academyMembership.findMany({
      where: { academyId, role: "REFEREE", isActive: true },
      include: { user: true, refereeCategory: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nuevo juego</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Completa la información del juego y asigna los árbitros
        </p>
      </div>

      <GameForm
        academyId={academyId}
        sports={sports.map((s) => ({ id: s.sport.id, name: s.sport.name }))}
        categories={categories}
        phases={phases.map((p) => ({ id: p.id, name: p.name }))}
        tournaments={tournaments.map((t) => ({ id: t.id, name: t.name }))}
        referees={referees.map((m) => ({
          id:            m.userId,
          name:          m.user.name,
          email:         m.user.email,
          category:      m.refereeCategory?.name ?? null,
          licenseNumber: m.user.licenseNumber ?? null,
        }))}
        defaults={searchParams.tournamentId ? {
          homeTeam: "", awayTeam: "", venue: "",
          sportId: "", gameCategoryId: "",
          startTime: "", endTime: "",
          tournamentId: searchParams.tournamentId,
        } : undefined}
      />
    </div>
  );
}
