import { requireAcademyAccess } from "@/lib/auth";
import { getSubscription } from "@/actions/subscription";
import { prisma } from "@/lib/prisma";
import { SubscriptionView } from "./subscription-view";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Suscripción" };

export default async function SubscriptionPage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  const [sub, academy] = await Promise.all([
    getSubscription(academyId),
    prisma.academy.findUnique({ where: { id: academyId }, select: { name: true } }),
  ]);

  return (
    <SubscriptionView
      academyId={academyId}
      academyName={academy?.name ?? ""}
      isAdmin={context.role === "ADMIN"}
      subscription={sub ? JSON.parse(JSON.stringify(sub)) : null}
    />
  );
}
