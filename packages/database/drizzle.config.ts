import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.cswxwjsntjmigyjqzkun:4s-Yhe4t8Ld%23DGP@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
  },
});
