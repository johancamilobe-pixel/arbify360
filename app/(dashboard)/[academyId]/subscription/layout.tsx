import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MobileLayout } from "@/components/layout/mobile-layout";
import type { AcademyRole } from "@/lib/auth";

// Este layout NO verifica suscripción — solo autenticación y membresía
// Se usa exclusivamente para la ruta /subscription

interface Props {
  children: React.ReactNode;
  params: { academyId: string };
}

export default async function SubscriptionLayout({ children, params }: Props) {
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

  return (
    <MobileLayout
      academyId={context.academyId}
      academyName={context.academyName}
      role={context.role}
      userName={user.name}
      userAcademies={userAcademies}
    >
      {children}
    </MobileLayout>
  );
}
