"use server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ImportRow {
  rowNumber: number;
  firstName:      string;
  lastName:       string;
  email:          string;
  documentType?:  string;
  documentNumber?: string;
  birthDate?:     string;
  phone?:         string;
  phone2?:        string;
  licenseNumber?: string;
}

export interface ImportResult {
  rowNumber:  number;
  name:       string;
  email:      string;
  status:     "created" | "updated" | "error";
  error?:     string;
}

const RowSchema = z.object({
  firstName:      z.string().min(1, "Nombres requeridos"),
  lastName:       z.string().min(1, "Apellidos requeridos"),
  email:          z.string().email("Email inválido"),
  documentType:   z.string().optional(),
  documentNumber: z.string().optional(),
  birthDate:      z.string().optional(),
  phone:          z.string().optional(),
  phone2:         z.string().optional(),
  licenseNumber:  z.string().optional(),
});

export async function importReferees(
  academyId: string,
  rows: ImportRow[]
): Promise<{ results: ImportResult[]; summary: { created: number; updated: number; errors: number } }> {
  await requireAdminRole(academyId);

  const results: ImportResult[] = [];

  for (const row of rows) {
    const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();

    const parsed = RowSchema.safeParse(row);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Datos inválidos";
      results.push({ rowNumber: row.rowNumber, name, email: row.email ?? "", status: "error", error: firstError });
      continue;
    }

    const data = parsed.data;
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    try {
      let user = await prisma.user.findUnique({ where: { email: data.email } });
      let status: "created" | "updated" = "created";

      if (!user) {
        // 1. Enviar invitación por email via Supabase Auth
        const supabaseAdmin = createAdminSupabaseClient();
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          data.email,
          {
            data: {
              first_name: data.firstName,
              last_name:  data.lastName,
            },
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`,
          }
        );
console.log("invite result:", { userId: authData?.user?.id, error: inviteError?.message });

        // 2. Crear en BD con supabaseId si se obtuvo
        user = await prisma.user.create({
          data: {
            supabaseId:     authData?.user?.id ?? null,
            email:          data.email,
            name:           fullName,
            firstName:      data.firstName,
            lastName:       data.lastName,
            documentType:   data.documentType   || null,
            documentNumber: data.documentNumber || null,
            birthDate:      data.birthDate ? new Date(data.birthDate) : null,
            phone:          data.phone  || null,
            phone2:         data.phone2 || null,
            licenseNumber:  data.licenseNumber  || null,
          },
        });
        console.log("created user supabaseId:", user.supabaseId);
}
else {
        status = "updated";
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name:           fullName,
            firstName:      data.firstName,
            lastName:       data.lastName,
            documentType:   data.documentType   ?? user.documentType,
            documentNumber: data.documentNumber ?? user.documentNumber,
            birthDate:      data.birthDate ? new Date(data.birthDate) : user.birthDate,
            phone:          data.phone  ?? user.phone,
            phone2:         data.phone2 ?? user.phone2,
            licenseNumber:  data.licenseNumber  ?? user.licenseNumber,
          },
        });
      }

      // Crear o actualizar membresía
      const existingMembership = await prisma.academyMembership.findUnique({
        where: { userId_academyId: { userId: user.id, academyId } },
      });

      if (!existingMembership) {
        await prisma.academyMembership.create({
          data: {
            userId:   user.id,
            academyId,
            role:     "REFEREE",
            isActive: true,
          },
        });
      } else {
        status = "updated";
      }

      results.push({ rowNumber: row.rowNumber, name: fullName, email: data.email, status });
    } catch (e: any) {
      results.push({
        rowNumber: row.rowNumber,
        name,
        email: row.email ?? "",
        status: "error",
        error: e?.message?.includes("Unique constraint")
          ? "Email duplicado en el archivo"
          : "Error al guardar",
      });
    }
  }

  revalidatePath(`/${academyId}/referees`);

  const summary = {
    created: results.filter((r) => r.status === "created").length,
    updated: results.filter((r) => r.status === "updated").length,
    errors:  results.filter((r) => r.status === "error").length,
  };

  return { results, summary };
}