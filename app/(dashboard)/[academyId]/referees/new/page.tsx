import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RefereeForm } from "../referee-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Agregar árbitro" };

export default async function NewRefereePage({ params }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const categories = await prisma.refereeCategory.findMany({
    where: { academyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href={`/${academyId}/referees`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 mb-4 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a árbitros
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Agregar árbitro</h1>

      <RefereeForm
        academyId={academyId}
        categories={categories.map((c) => ({
          id:          c.id,
          name:        c.name,
          ratePerGame: c.ratePerGame?.toString() ?? null,
        }))}
        mode="create"
      />
    </div>
  );
}
