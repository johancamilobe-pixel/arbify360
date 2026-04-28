import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { getMyAvailability, getTeamAvailability } from "@/actions/availability";
import { MyAvailability } from "./my-availability";
import { AvailabilityCalendar } from "./availability-calendar";
import { AvailabilityFilter } from "./availability-filter";
import { DateRangeSelector } from "./date-range-selector";

interface Props {
  params: { academyId: string };
  searchParams: { from?: string; to?: string };
}

export async function generateMetadata() {
  return { title: "Disponibilidad" };
}

export default async function AvailabilityPage({ params, searchParams }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);
  const currentUser = await getDbUser();

  if (!currentUser) return null;

  // Rango de fechas: query params o mes actual
  const now = new Date();
  const fromStr = searchParams.from
    ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const toStr = searchParams.to
    ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const fromDate = new Date(fromStr + "T00:00:00");
  const toDate   = new Date(toStr + "T23:59:59");

  const isAdmin = context.role === "ADMIN";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Disponibilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin
            ? "Consulta la disponibilidad de tu equipo de árbitros"
            : "Registra los días y horarios en los que estás disponible"
          }
        </p>
      </div>

      {/* Selector de mes */}
      <div className="mb-6">
        <DateRangeSelector
          academyId={academyId}
          currentFrom={fromStr}
          currentTo={toStr}
        />
      </div>

      {/* Vista Admin */}
      {isAdmin && (
        <AdminView
          academyId={academyId}
          fromDate={fromDate}
          toDate={toDate}
          fromStr={fromStr}
          toStr={toStr}
        />
      )}

      {/* Vista Árbitro (siempre visible para que el admin también pueda marcar si quiere) */}
      {!isAdmin && (
        <RefereeView
          academyId={academyId}
          userId={currentUser.id}
          fromDate={fromDate}
          toDate={toDate}
          fromStr={fromStr}
          toStr={toStr}
        />
      )}
    </div>
  );
}

// ─── Vista Admin ──────────────────────────────────────────────────────────────

async function AdminView({
  academyId,
  fromDate,
  toDate,
  fromStr,
  toStr,
}: {
  academyId: string;
  fromDate: Date;
  toDate: Date;
  fromStr: string;
  toStr: string;
}) {
  const teamSlots = await getTeamAvailability(academyId, fromDate, toDate);

  return (
    <div className="space-y-6">
      {/* Filtro rápido */}
      <AvailabilityFilter academyId={academyId} />

      {/* Calendario del equipo */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Calendario del equipo
        </h2>
        {teamSlots.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground/70">
              Ningún árbitro ha registrado disponibilidad en este período
            </p>
          </div>
        ) : (
          <AvailabilityCalendar
            slots={teamSlots}
            fromDate={fromStr}
            toDate={toStr}
          />
        )}
      </div>
    </div>
  );
}

// ─── Vista Árbitro ────────────────────────────────────────────────────────────

async function RefereeView({
  academyId,
  userId,
  fromDate,
  toDate,
  fromStr,
  toStr,
}: {
  academyId: string;
  userId: string;
  fromDate: Date;
  toDate: Date;
  fromStr: string;
  toStr: string;
}) {
  const mySlots = await getMyAvailability(academyId, userId, fromDate, toDate);

  return (
    <MyAvailability
      academyId={academyId}
      userId={userId}
      existing={mySlots}
      fromDate={fromStr}
      toDate={toStr}
    />
  );
}
