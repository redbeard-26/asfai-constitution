import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 configuration. Connection URLs for the CLI (migrate / db push /
// studio / seed) live here. Use the direct (non-pooled) URL for schema
// operations, falling back to the pooled URL if only one is configured.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
