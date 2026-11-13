import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.klyvoraPrisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
    }),
    log: ["warn"],
  });
if (process.env.NODE_ENV !== "production")
  globalForPrisma.klyvoraPrisma = prisma;
