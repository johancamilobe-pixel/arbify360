import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const academies = await prisma.academy.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(academies);
  } catch (error) {
    console.error("Error fetching academies:", error);
    return NextResponse.json({ error: "Error al cargar academias" }, { status: 500 });
  }
}
