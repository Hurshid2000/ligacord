import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the datasource URL out of schema.prisma into this file.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
