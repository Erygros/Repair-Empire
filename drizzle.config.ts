import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
if (process.argv.includes("migrate") && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for migrations");
export default defineConfig({ schema: "./src/db/schema.ts", out: "./drizzle", dialect: "postgresql", dbCredentials: { url: process.env.DATABASE_URL ?? "" } });
