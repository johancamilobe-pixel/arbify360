"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─────────────────────────────────────────────────────────────────────────────
// CREAR SOLICITUD
// Llamado desde la página pública /register
// Crea la cuenta en Supabase Auth + guarda la solicitud en BD como PENDING
// ─────────────────────────────────────────────────────────────────────────────

export async function createRefereeRequest(data: {
  academyId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  password: string;
}) {
  try {
    // Verificar que la academia existe
    const academy = await prisma.academy.findUnique({
      where: { id: data.academyId },
    });

    if (!academy) {
      return { error: "Academia no encontrada" };
    }

    // Verificar que no exista ya una solicitud con ese email para esa academia
    const existingRequest = await prisma.refereeRequest.findUnique({
      where: { email_academyId: { email: data.email, academyId: data.academyId } },
    });

    if (existingRequest) {
      return { error: "Ya existe una solicitud con este email para esta academia" };
    }

    // Verificar que no exista ya un usuario con ese email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Ya existe una cuenta con este email" };
    }

    // Crear cuenta en Supabase Auth con contraseña
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Confirmamos directo, no requiere email de confirmación
    });

    if (authError || !authData.user) {
      console.error("Error creando usuario en Supabase:", authError);
      if (authError?.code === "email_exists") {
        return { error: "Ya existe una cuenta con este email" };
      }
      return { error: "Error al crear la cuenta. Intenta de nuevo." };
    }

    // Guardar solicitud en BD como PENDING
    await prisma.refereeRequest.create({
      data: {
        academyId: data.academyId,
        firstName: data.firstName,
        lastName: data.lastName,
        documentNumber: data.documentNumber,
        email: data.email,
        supabaseId: authData.user.id,
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en createRefereeRequest:", error);
    return { error: "Error inesperado. Intenta de nuevo." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER SOLICITUDES PENDIENTES
// Llamado desde el panel del admin
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingRequests(academyId: string) {
  return prisma.refereeRequest.findMany({
    where: { academyId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACEPTAR SOLICITUD
// Crea el User en BD + AcademyMembership y marca la solicitud como ACCEPTED
// ─────────────────────────────────────────────────────────────────────────────

export async function acceptRefereeRequest(requestId: string, academyId: string) {
  try {
    const request = await prisma.refereeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { error: "Solicitud no encontrada" };
    if (request.status !== "PENDING") return { error: "La solicitud ya fue procesada" };

    // Crear User en BD
    const newUser = await prisma.user.create({
      data: {
        supabaseId: request.supabaseId,
        email: request.email,
        name: `${request.firstName} ${request.lastName}`,
        firstName: request.firstName,
        lastName: request.lastName,
        documentNumber: request.documentNumber,
      },
    });

    // Crear membresía como REFEREE
    await prisma.academyMembership.create({
      data: {
        userId: newUser.id,
        academyId,
        role: "REFEREE",
        isActive: true,
      },
    });

    // Marcar solicitud como ACCEPTED
    await prisma.refereeRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    revalidatePath(`/${academyId}/referees/requests`);
    revalidatePath(`/${academyId}/referees`);

    return { success: true };
  } catch (error) {
    console.error("Error en acceptRefereeRequest:", error);
    return { error: "Error al aceptar la solicitud" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECHAZAR SOLICITUD
// Elimina la cuenta de Supabase Auth y borra la solicitud de BD
// ─────────────────────────────────────────────────────────────────────────────

export async function rejectRefereeRequest(requestId: string, academyId: string) {
  try {
    const request = await prisma.refereeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { error: "Solicitud no encontrada" };
    if (request.status !== "PENDING") return { error: "La solicitud ya fue procesada" };

    // Eliminar cuenta de Supabase Auth si existe
    if (request.supabaseId) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        request.supabaseId
      );
      if (deleteError) {
        console.error("Error eliminando usuario de Supabase:", deleteError);
      }
    }

    // Eliminar la solicitud de BD
    await prisma.refereeRequest.delete({
      where: { id: requestId },
    });

    revalidatePath(`/${academyId}/referees/requests`);

    return { success: true };
  } catch (error) {
    console.error("Error en rejectRefereeRequest:", error);
    return { error: "Error al rechazar la solicitud" };
  }
}
