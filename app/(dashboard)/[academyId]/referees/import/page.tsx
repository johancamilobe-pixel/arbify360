import { requireAdminRole } from "@/lib/auth";
import { RefereeImporter } from "./referee-importer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Importar árbitros" };

export default async function ImportRefereesPage({ params }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/${academyId}/referees`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a árbitros
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Importar árbitros</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Carga un listado masivo de árbitros desde un archivo Excel.
          Descarga la plantilla, complétala y súbela aquí.
        </p>
      </div>

      <RefereeImporter academyId={academyId} />
    </div>
  );
}
