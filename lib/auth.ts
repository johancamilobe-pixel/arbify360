import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Obtener usuario autenticado de Supabase
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Obtener usuario de la DB (por supabaseId)
export async function getDbUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
}

// Verificar acceso a academia
export async function requireAcademyAccess(academyId: string) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/sign-in");

  const membership = await prisma.academyMembership.findFirst({
    where: {
      userId: dbUser.id,
      academyId,
      isActive: true,
    },
  });

  if (!membership) redirect("/select-academy");

  return { user: dbUser, role: membership.role, membership };
}

// Verificar rol admin
export async function requireAdminRole(academyId: string) {
  const context = await requireAcademyAccess(academyId);
  if (context.role !== "ADMIN") redirect("/select-academy");
  return context;
}

// Tipo de rol
export type AcademyRole = "ADMIN" | "REFEREE";

// Obtener academias del usuario
export async function getUserAcademies() {
  const dbUser = await getDbUser();
  if (!dbUser) return [];

  const memberships = await prisma.academyMembership.findMany({
    where: { userId: dbUser.id, isActive: true },
    include: { academy: true },
  });

  return memberships.map((m) => ({
    academyId:   m.academyId,
    academyName: m.academy.name,
    academyLogo: m.academy.logoUrl,
    role:        m.role as AcademyRole,
  }));
}