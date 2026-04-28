import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type AcademyRole = "ADMIN" | "REFEREE";

export interface AcademyContext {
  academyId: string;
  academyName: string;
  role: AcademyRole;
}

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER USUARIO DE LA DB A PARTIR DEL CLERK ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        where: { isActive: true },
        include: { academy: true },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIAS A LAS QUE PERTENECE EL USUARIO
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserAcademies() {
  const user = await getDbUser();
  if (!user) return [];

  return user.memberships.map((m) => ({
    academyId: m.academyId,
    academyName: m.academy.name,
    academyLogo: m.academy.logoUrl,
    role: m.role as AcademyRole,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR QUE EL USUARIO PERTENECE A UNA ACADEMIA ESPECÍFICA
// Usado en layouts y server actions para validar acceso al tenant
// ─────────────────────────────────────────────────────────────────────────────

export async function requireAcademyAccess(
  academyId: string
): Promise<AcademyContext> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Una sola query trae usuario + membresía + academia
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        where: { academyId, isActive: true },
        include: { academy: true },
        take: 1,
      },
    },
  });

  if (!user) redirect("/sign-in");

  const membership = user.memberships[0];
  if (!membership) redirect("/select-academy");

  return {
    academyId: membership.academyId,
    academyName: membership.academy.name,
    role: membership.role as AcademyRole,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR ROL DE ADMIN (para acciones exclusivas del admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function requireAdminRole(academyId: string): Promise<AcademyContext> {
  const context = await requireAcademyAccess(academyId);
  if (context.role !== "ADMIN") {
    redirect(`/${academyId}`);
  }
  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR SUPER ADMIN
// ─────────────────────────────────────────────────────────────────────────────

export async function requireSuperAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
  if (role !== "super_admin") redirect("/select-academy");
}

// ─────────────────────────────────────────────────────────────────────────────
// CREAR USUARIO EN DB AL PRIMER LOGIN (webhook de Clerk)
// Llamado desde el webhook handler, no directamente
// ─────────────────────────────────────────────────────────────────────────────

export async function syncClerkUser(clerkId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
      photoUrl: clerkUser.imageUrl,
    },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
      photoUrl: clerkUser.imageUrl,
    },
  });
}
