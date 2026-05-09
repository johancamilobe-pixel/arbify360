"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function createAcademyWithAdmin(data: {
  academyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    // Verificar que no exista ya un usuario con ese email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con este email" };
    }

    // Crear cuenta en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Error creando usuario en Supabase:", authError);
      return { error: "Error al crear la cuenta. Intenta de nuevo." };
    }

    // Crear academia + usuario + membresía en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear academia
      const academy = await tx.academy.create({
        data: {
          name: data.academyName,
          isActive: true,
        },
      });

      // Crear usuario admin
      const user = await tx.user.create({
        data: {
          supabaseId: authData.user.id,
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      // Crear membresía como ADMIN
      await tx.academyMembership.create({
        data: {
          userId: user.id,
          academyId: academy.id,
          role: "ADMIN",
          isActive: true,
        },
      });

      // Crear suscripción con 10 días de trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 10);

      await tx.subscription.create({
        data: {
          academyId: academy.id,
          status: "TRIAL",
          trialEndsAt,
        },
      });

      return { academy, user };
    });

    return { success: true, academyId: result.academy.id };
  } catch (error) {
    console.error("Error en createAcademyWithAdmin:", error);
    return { error: "Error inesperado. Intenta de nuevo." };
  }
}
