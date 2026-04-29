import { requireAcademyAccess, getDbUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime, GAME_ROLE_LABELS } from "@/lib/utils";
import { RefereeReceiptView } from "./referee-receipt-view";

interface Props {
  params: { academyId: string; paymentId: string };
}

export const metadata = { title: "Recibo de pago" };

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia bancaria",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
};

const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

export default async function RefereeReceiptPage({ params }: Props) {
  const { academyId, paymentId } = params;
  const context = await requireAcademyAccess(academyId);
  if (context.role !== "REFEREE") redirect(`/${academyId}`);

  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      referee: true,
      paidBy: true,
      academy: true,
      items: {
        include: {
          scoresheetSubmission: {
            include: {
              scoresheet: {
                include: {
                  game: {
                    include: { sport: true, gameCategory: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Verificar que el pago pertenece al árbitro logueado y a la academia
  if (!payment || payment.academyId !== academyId || payment.refereeId !== user.id) {
    notFound();
  }

  const receipt = {
    id:            payment.id,
    receiptNumber: payment.receiptNumber,
    academyName:   payment.academy.name,
    refereeName:   payment.referee.name,
    refereeEmail:  payment.referee.email,
    periodType:    PERIOD_LABELS[payment.periodType] ?? payment.periodType,
    periodStart:   formatDate(payment.periodStart),
    periodEnd:     formatDate(payment.periodEnd),
    method:        METHOD_LABELS[payment.method] ?? payment.method,
    paidAt:        formatDate(payment.paidAt),
    paidByName:    payment.paidBy.name,
    totalAmount:   formatCurrency(Number(payment.totalAmount)),
    status:        payment.status,
    items: payment.items.map((item) => ({
      id:        item.id,
      homeTeam:  item.scoresheetSubmission.scoresheet.game.homeTeam,
      awayTeam:  item.scoresheetSubmission.scoresheet.game.awayTeam,
      venue:     item.scoresheetSubmission.scoresheet.game.venue,
      sport:     item.scoresheetSubmission.scoresheet.game.sport.name,
      startTime: formatDateTime(item.scoresheetSubmission.scoresheet.game.startTime),
      gameRole:  GAME_ROLE_LABELS[item.scoresheetSubmission.role] ?? item.scoresheetSubmission.role,
      amount:    formatCurrency(Number(item.amount)),
    })),
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <RefereeReceiptView receipt={JSON.parse(JSON.stringify(receipt))} academyId={academyId} />
    </div>
  );
}
