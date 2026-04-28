import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  formatDate,
  formatTime,
  formatCurrency,
  GAME_ROLE_LABELS,
  cn,
} from "@/lib/utils";
import { SubmissionUpload } from "./submission-upload";
import { SubmissionReview } from "./submission-review";

interface Props {
  params: { academyId: string; gameId: string };
}

export async function generateMetadata({ params }: Props) {
  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game) return { title: "Planilla" };
  return { title: `Planilla — ${game.homeTeam} vs ${game.awayTeam}` };
}

export default async function ScoresheetDetailPage({ params }: Props) {
  const { academyId, gameId } = params;
  const context = await requireAcademyAccess(academyId);
  const currentUser = await getDbUser();

  const game = await prisma.game.findUnique({
    where: { id: gameId, academyId },
    include: {
      sport: true,
      gameCategory: true,
      assignments: {
        include: {
          user: true,
        },
      },
      scoresheet: {
        include: {
          submissions: {
            include: {
              user: true,
              approvedBy: true,
            },
          },
        },
      },
    },
  });

  if (!game) notFound();

  const isAdmin = context.role === "ADMIN";
  const canUpload = ["CONFIRMED", "FINISHED"].includes(game.status);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {game.homeTeam} <span className="text-muted-foreground/70 font-normal">vs</span> {game.awayTeam}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(game.startTime)} · {formatTime(game.startTime)} – {formatTime(game.endTime)} · {game.venue}
        </p>
        <p className="text-sm text-brand-600 font-medium">
          {game.sport.name} · {game.gameCategory.name}
        </p>
      </div>

      {/* Estado del juego */}
      {!canUpload && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          El juego debe estar <strong>confirmado</strong> o <strong>finalizado</strong> para poder subir planillas.
          Estado actual: <strong>{game.status}</strong>
        </div>
      )}

      {/* Lista de árbitros y sus planillas */}
      <div className="space-y-4">
        {game.assignments.map((assignment) => {
          const submission = game.scoresheet?.submissions.find(
            (s) => s.userId === assignment.userId
          );
          const isCurrentUser = currentUser?.id === assignment.userId;

          return (
            <div
              key={assignment.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              {/* Header del árbitro */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-foreground">{assignment.user.name}</p>
                  <p className="text-sm text-muted-foreground">{GAME_ROLE_LABELS[assignment.role]}</p>
                </div>
                {submission && (
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    submission.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    submission.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {submission.status === "APPROVED" ? "Aprobada" :
                     submission.status === "REJECTED" ? "Rechazada" : "Pendiente"}
                  </span>
                )}
                {!submission && (
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                    Sin subir
                  </span>
                )}
              </div>

              {/* Foto de la planilla */}
              {submission?.photoUrl && (
                <div className="mb-4">
                  <a
                    href={submission.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={submission.photoUrl}
                      alt="Planilla"
                      className="w-full max-h-80 object-contain rounded-lg border border-border bg-background"
                    />
                  </a>
                </div>
              )}

              {/* Comentario del árbitro */}
              {submission?.refereeComment && (
                <div className="mb-3 bg-background rounded-lg p-3">
                  <p className="text-xs text-muted-foreground/70 mb-1">Comentario del árbitro</p>
                  <p className="text-sm text-foreground/80">{submission.refereeComment}</p>
                </div>
              )}

              {/* Comentario del admin */}
              {submission?.adminComment && (
                <div className="mb-3 bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-400 mb-1">
                    Comentario del admin ({submission.approvedBy?.name})
                  </p>
                  <p className="text-sm text-blue-700">{submission.adminComment}</p>
                </div>
              )}

              {/* Pago aprobado */}
              {submission?.status === "APPROVED" && submission.paymentAmount && isAdmin && (
                <div className="mb-3 flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <span className="text-sm text-green-600">Pago registrado</span>
                  <span className="text-green-700 font-bold">{formatCurrency(submission.paymentAmount)}</span>
                </div>
              )}

              {/* Subir planilla — solo el árbitro asignado */}
              {isCurrentUser && canUpload && (!submission || submission.status === "REJECTED") && (
                <SubmissionUpload
                  academyId={academyId}
                  gameId={gameId}
                  userId={assignment.userId}
                  role={assignment.role}
                  isResubmit={submission?.status === "REJECTED"}
                />
              )}

              {/* Revisar — solo admin */}
              {isAdmin && submission && submission.status === "PENDING" && currentUser && (
                <SubmissionReview
                  academyId={academyId}
                  submissionId={submission.id}
                  adminUserId={currentUser.id}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Sin árbitros */}
      {game.assignments.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground/70">No hay árbitros asignados a este juego</p>
        </div>
      )}
    </div>
  );
}
