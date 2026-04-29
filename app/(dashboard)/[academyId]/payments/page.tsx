import { requireAdminRole } from "@/lib/auth";

interface Props {
  params: { academyId: string };
  searchParams: { [key: string]: string | undefined };
}

export async function generateMetadata() {
  return { title: "Pagos" };
}

export default async function PaymentsPage({ params, searchParams }: Props) {
  const academyId = params.academyId;
  await requireAdminRole(academyId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modulo de pagos - prueba basica
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Pagina cargada correctamente. Academy: {academyId}
        </p>
      </div>
    </div>
  );
}