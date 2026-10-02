import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getAccountConfig } from "@/lib/account-config";

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;
export function getDb() {
  const { databaseURL } = getAccountConfig();
  if (!database) database = drizzle(postgres(databaseURL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 }), { schema });
  return database;
}
