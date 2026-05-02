import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { SubscriptionGate } from "@/components/layout/subscription-gate";
import type { AcademyRole } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  params: { academyId: string };
}

export default async function AcademyLayout({ children, params }: Props) {
  const { academyId } = params;

  const supabase = await createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      memberships: {
        where: { isActive: true },
        include: { academy: true },
      },
    },
  });

  if (!user) redirect("/sign-in");

  const currentMembership = user.memberships.find((m) => m.academyId === academyId);
  if (!currentMembership) redirect("/select-academy");

  const context = {
    academyId:   currentMembership.academyId,
    academyName: currentMembership.academy.name,
    role:        currentMembership.role as AcademyRole,
  };

  const userAcademies = user.memberships.map((m) => ({
    academyId:   m.academyId,
    academyName: m.academy.name,
    academyLogo: m.academy.logoUrl,
    role:        m.role as AcademyRole,
  }));

  // ─── Verificar suscripción ────────────────────────────────────────────────
  const sub = await prisma.subscription.findUnique({
    where: { academyId },
    select: { status: true, trialEndsAt: true, subscriptionEndsAt: true },
  });

  let hasAccess = true;
  if (sub) {
    const now = new Date();
    if (sub.status === "TRIAL") {
      hasAccess = now <= sub.trialEndsAt;
    } else if (sub.status === "ACTIVE") {
      hasAccess = sub.subscriptionEndsAt ? now <= sub.subscriptionEndsAt : false;
    } else {
      hasAccess = false;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <MobileLayout
      academyId={context.academyId}
      academyName={context.academyName}
      role={context.role}
      userName={user.name}
      userAcademies={userAcademies}
    >
      {hasAccess ? (
        children
      ) : (
        <SubscriptionGate
          academyId={academyId}
          academyName={context.academyName}
          isAdmin={context.role === "ADMIN"}
          wompiPublicKey={process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!}
          amount={1000000}
        />
      )}
    </MobileLayout>
  );
}