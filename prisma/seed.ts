import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const baloncesto = await prisma.sport.upsert({
    where: { name: "Baloncesto" },
    update: {},
    create: { name: "Baloncesto" },
  });

  const academia = await prisma.academy.upsert({
    where: { id: "academia-semillas-001" },
    update: {},
    create: { id: "academia-semillas-001", name: "Academia Semillas", isActive: true },
  });

  await prisma.academySport.upsert({
    where: { academyId_sportId: { academyId: academia.id, sportId: baloncesto.id } },
    update: {},
    create: { academyId: academia.id, sportId: baloncesto.id },
  });

  const categoriaJunior = await prisma.refereeCategory.upsert({
    where: { academyId_name: { academyId: academia.id, name: "Junior" } },
    update: {},
    create: { academyId: academia.id, name: "Junior" },
  });

  await prisma.refereeCategory.upsert({
    where: { academyId_name: { academyId: academia.id, name: "Senior" } },
    update: {},
    create: { academyId: academia.id, name: "Senior" },
  });

  await prisma.gameCategory.upsert({
    where: { academyId_name: { academyId: academia.id, name: "Juvenil" } },
    update: {},
    create: { academyId: academia.id, name: "Juvenil", incomePerGame: 150000 },
  });

  await prisma.gameCategory.upsert({
    where: { academyId_name: { academyId: academia.id, name: "Élite" } },
    update: {},
    create: { academyId: academia.id, name: "Élite", incomePerGame: 195000 },
  });

  // Admin — buscar por email, si no existe crear sin supabaseId por ahora
  const adminUser = await prisma.user.upsert({
    where: { email: "johancamilobe@gmail.com" },
    update: {},
    create: {
      email: "johancamilobe@gmail.com",
      name: "Admin Principal",
      firstName: "Johan",
      lastName: "Camilo",
    },
  });

  await prisma.academyMembership.upsert({
    where: { userId_academyId: { userId: adminUser.id, academyId: academia.id } },
    update: {},
    create: { userId: adminUser.id, academyId: academia.id, role: "ADMIN", isActive: true },
  });

  // Árbitro de prueba
  const arbitro1 = await prisma.user.upsert({
    where: { email: "arbitro1@prueba.com" },
    update: {},
    create: {
      email: "arbitro1@prueba.com",
      name: "Carlos Pérez",
      firstName: "Carlos",
      lastName: "Pérez",
      licenseNumber: "ARB-001",
    },
  });

  await prisma.academyMembership.upsert({
    where: { userId_academyId: { userId: arbitro1.id, academyId: academia.id } },
    update: {},
    create: {
      userId: arbitro1.id,
      academyId: academia.id,
      role: "REFEREE",
      refereeCategoryId: categoriaJunior.id,
      isActive: true,
    },
  });

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(19, 0, 0, 0);
  const fin = new Date(manana);
  fin.setHours(22, 0, 0, 0);

  const categoriaElite = await prisma.gameCategory.findFirst({
    where: { academyId: academia.id, name: "Élite" },
  });

  await prisma.game.create({
    data: {
      academyId: academia.id,
      sportId: baloncesto.id,
      gameCategoryId: categoriaElite!.id,
      homeTeam: "Águilas FC",
      awayTeam: "Tigres BC",
      venue: "Coliseo El Salitre",
      startTime: manana,
      endTime: fin,
      status: "SCHEDULED",
      incomeAmount: 195000,
    },
  });

  console.log("🎉 Seed completado");
  console.log(`Dashboard: http://localhost:3000/${academia.id}`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
