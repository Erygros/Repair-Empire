import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";

if (process.env.VERCEL || process.env.NODE_ENV === "production") throw new Error("Local PostgreSQL must not run in production.");
const directory = resolve(".local");
await mkdir(directory, { recursive: true });
let settings;
try { settings = JSON.parse(await readFile(resolve(directory, "database.json"), "utf8")); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  settings = { port: 55432, password: randomBytes(32).toString("base64url"), secret: randomBytes(48).toString("base64url") };
  await writeFile(resolve(directory, "database.json"), JSON.stringify(settings), { mode: 0o600, flag: "wx" });
}
try {
  const existing = await readFile(".env.local", "utf8");
  if (!existing.includes("127.0.0.1:" + settings.port + "/repair_empire")) throw new Error("An existing .env.local points to another database. It will not be overwritten.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeFile(".env.local", [
    "# Generated local-only credentials. Never commit this file.",
    "DATABASE_URL=postgresql://postgres:" + settings.password + "@127.0.0.1:" + settings.port + "/repair_empire",
    "BETTER_AUTH_SECRET=" + settings.secret,
    "BETTER_AUTH_URL=http://localhost:3000",
    "",
  ].join("\n"), { mode: 0o600, flag: "wx" });
}
const databaseDir = resolve(directory, "postgres");
const pg = new EmbeddedPostgres({
  databaseDir, user: "postgres", password: settings.password, port: settings.port,
  persistent: true, authMethod: "scram-sha-256", postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {}, onError: () => console.error("Local PostgreSQL operation failed."),
});
try { await readFile(resolve(databaseDir, "PG_VERSION")); }
catch (error) { if (error.code !== "ENOENT") throw error; await pg.initialise(); }
await pg.start();
const sql = postgres({ host: "127.0.0.1", port: settings.port, username: "postgres", password: settings.password, database: "postgres", max: 1 });
try {
  const existing = await sql`select 1 from pg_database where datname = 'repair_empire'`;
  if (!existing.length) await sql.unsafe('CREATE DATABASE "repair_empire"');
} finally { await sql.end(); }
console.log("Local PostgreSQL ready at 127.0.0.1:" + settings.port + ". Run npm run db:migrate, then npm run dev.");
