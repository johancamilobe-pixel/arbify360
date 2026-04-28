import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MobileLayout } from "@/components/layout/mobile-layout";
import type { AcademyRole } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  params: { academyId: string };
}

export default async function AcademyLayout({ children, params }: Props) {
  const { academyId } = params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Una sola query — usuario + membresía actual + todas las membresías activas
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
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
      userAcademies={userAcademies}
    >
      {children}
    </MobileLayout>
  );
}
