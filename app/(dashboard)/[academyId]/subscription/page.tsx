import { requireAcademyAccess } from "@/lib/auth";
import { getSubscription } from "@/actions/subscription";
import { redirect } from "next/navigation";
import { SubscriptionView } from "./subscription-view";

interface Props {
  params: { academyId: string };
}

export const metadata = { title: "Suscripción" };

export default async function SubscriptionPage({ params }: Props) {
  const { academyId } = params;
  const context = await requireAcademyAccess(academyId);

  // Solo admin puede ver/gestionar la suscripción
  // Árbitros bloqueados son redirigidos aquí pero ven solo el mensaje
  const sub = await getSubscription(academyId);

  const academy = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.academy.findUnique({ where: { id: academyId }, select: { name: true } })
  );

  return (
    <SubscriptionView
      academyId={academyId}
      academyName={academy?.name ?? ""}
      isAdmin={context.role === "ADMIN"}
      subscription={sub ? JSON.parse(JSON.stringify(sub)) : null}
      wompiPublicKey={process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!}
      amount={1000000} // 10.000 COP en centavos (WOMPI usa centavos)
    />
  );
}
