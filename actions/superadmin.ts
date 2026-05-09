"use server";

import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const SUPERADMIN_EMAIL = "johancamilobe@gmail.com";

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== SUPERADMIN_EMAIL) {
    redirect("/sign-in");
  }
  return user;
}

export async function toggleAcademyStatus(academyId: string, newStatus: boolean) {
  await requireSuperAdmin();

  await prisma.academy.update({
    where: { id: academyId },
    data: { isActive: newStatus },
  });

  revalidatePath("/superadmin/academias");
  return { success: true };
}
