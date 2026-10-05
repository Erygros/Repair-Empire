import nextEnv from "@next/env";
import postgres from "postgres";

// Do not migrate production implicitly; keep the current deployment serving until its schema is ready.
if (process.env.VERCEL) {
  nextEnv.loadEnvConfig(process.cwd());
  let database;
  try {
    if (!process.env.DATABASE_URL) throw new Error("Missing database configuration");
    database = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 5 });
    await database`select character_model_id from character limit 0`;
    console.log("Founder schema ready for deployment.");
  } catch {
    console.error("Deployment blocked: verify DATABASE_URL and run npm run db:migrate against the deployment database before redeploying. No database changes were made by this check.");
    process.exitCode = 1;
  } finally {
    if (database) await database.end();
  }
}
