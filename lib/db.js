import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter — the datasource URL no longer
// lives in schema.prisma (it's in prisma.config.ts for the CLI only).
// Reuse one client across hot reloads in dev, otherwise every reload opens a
// new pool and Postgres runs out of connections.
const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
