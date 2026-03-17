import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL (bypasses pgbouncer) for CLI commands (migrate, db push, etc.)
    // Prisma Client at runtime uses DATABASE_URL (pooled) separately
    url: env("DIRECT_URL"),
  },
});
