import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prismaLog: Prisma.LogLevel[] =
  process.env.PRISMA_DEBUG_QUERIES === "1"
    ? ["query", "error", "warn"]
    : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLog
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
