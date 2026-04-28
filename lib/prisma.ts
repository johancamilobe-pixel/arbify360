import { PrismaClient } from "@prisma/client";

// Patrón singleton para evitar múltiples conexiones en desarrollo
// (Next.js hot reload crea nuevas instancias en cada cambio)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
