import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/auth";

// La plantilla está en public/plantilla_arbitros.xlsx
// O la generamos dinámicamente con exceljs
export async function GET(
  request: Request,
  { params }: { params: { academyId: string } }
) {
  await requireAdminRole(params.academyId);

  // Leer la plantilla estática desde /public
  const baseUrl = new URL(request.url).origin;
  const res = await fetch(`${baseUrl}/plantilla_arbitros.xlsx`);

  if (!res.ok) {
    return new NextResponse("Plantilla no encontrada", { status: 404 });
  }

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_arbitros.xlsx"',
    },
  });
}
