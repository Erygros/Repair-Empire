import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!database) database = drizzle(postgres(process.env.DATABASE_URL, { prepare: false, max: 1 }), { schema });
  return database;
}
