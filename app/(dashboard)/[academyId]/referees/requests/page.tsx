import { requireAdminRole } from "@/lib/auth";
import { getPendingRequests } from "@/actions/referee-requests";
import { Users } from "lucide-react";
import { RefereeRequestsList } from "./referee-requests-list";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Solicitudes de ingreso" };

export default async function RefereeRequestsPage({ params }: Props) {
  const { academyId } = params;
  await requireAdminRole(academyId);

  const requests = await getPendingRequests(academyId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes de ingreso</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {requests.length} solicitud{requests.length !== 1 ? "es" : ""} pendiente
            {requests.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <RefereeRequestsList requests={requests} academyId={academyId} />
      )}
    </div>
  );
}
