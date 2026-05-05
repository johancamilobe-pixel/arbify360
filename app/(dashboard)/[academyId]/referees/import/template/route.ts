import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(
  request: Request,
  { params }: { params: { academyId: string } }
) {
  await requireAdminRole(params.academyId);

  const workbook  = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Árbitros");

  // Título
  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Plantilla de importación de árbitros — ArbiFy360";
  titleCell.font  = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center" };

  // Encabezados
  const headers = [
    "Nombres *",
    "Apellidos *",
    "Email *",
    "Tipo documento",
    "Número documento",
    "Fecha nacimiento (YYYY-MM-DD)",
    "Teléfono",
    "Teléfono 2",
    "Número licencia",
    "Tarifa por juego",
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF6B00" } };
    cell.alignment = { horizontal: "center" };
    cell.border    = {
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });

  // Fila de ejemplo
  const exampleRow = worksheet.addRow([
    "Juan",
    "Pérez García",
    "juan.perez@email.com",
    "CC",
    "12345678",
    "1990-05-15",
    "3001234567",
    "",
    "ARB-001",
    "50000",
  ]);
  exampleRow.eachCell((cell) => {
    cell.font = { italic: true, color: { argb: "FF888888" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
  });

  // Anchos de columna
  worksheet.columns = [
    { width: 18 },
    { width: 20 },
    { width: 28 },
    { width: 18 },
    { width: 20 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 18 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_arbitros.xlsx"',
    },
  });
}