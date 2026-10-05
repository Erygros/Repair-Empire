import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const db = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["localhost", "127.0.0.1"].includes(db.hostname) || db.pathname !== "/repair_empire" || process.env.VERCEL) throw new Error("Production-mode QA requires the local test database.");

async function server(port, env) {
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(port, "127.0.0.1", resolve); });
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env, NODE_ENV: "production", ...env }, windowsHide: true, stdio: "ignore",
  });
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error("Production QA server exited.");
      try { if ((await fetch("http://127.0.0.1:" + port + "/login")).ok) return child; } catch {}
      await sleep(100);
    }
    throw new Error("Production QA server did not become ready.");
  } catch (error) { await stop(child); throw error; }
}
async function stop(child) {
  if (child.exitCode !== null) return;
  const closed = once(child, "exit");
  child.kill();
  await closed;
}
const origin = "http://127.0.0.1:3001";
const app = await server(3001, { BETTER_AUTH_URL: origin });
try {
  const tests = spawn(process.execPath, ["--test", "tests/auth.integration.mjs", "tests/leaderboard-game.test.mjs", "tests/leaderboard.integration.mjs", "tests/character-models.integration.mjs", "tests/character-models.test.mjs"], { env: { ...process.env, NODE_ENV: "production", BETTER_AUTH_URL: origin }, windowsHide: true, stdio: "inherit" });
  const [code] = await once(tests, "exit");
  assert.equal(code, 0, "Production lifecycle tests must pass.");
} finally { await stop(app); }

const missing = await server(3002, { DATABASE_URL: "", BETTER_AUTH_SECRET: "", BETTER_AUTH_URL: "" });
try {
  const response = await fetch("http://127.0.0.1:3002/api/auth/get-session");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "ACCOUNT_SERVICE_NOT_CONFIGURED");
  for (const path of ["/play", "/create-character", "/account", "/leaderboard"]) {
    const result = await fetch("http://127.0.0.1:3002" + path, { redirect: "manual" });
    assert.equal(result.status, 307);
    assert.equal(new URL(result.headers.get("location"), "http://127.0.0.1:3002").pathname, "/login");
  }
  console.log("Missing production configuration: explicit 503 and all protected routes fail closed.");
  for (const path of ["/api/leaderboard", "/api/game/verified"]) {
    const response = await fetch("http://127.0.0.1:3002" + path);
    assert.equal(response.status, 503);
    assert.equal(JSON.stringify(await response.json()).includes("postgresql://"), false);
  }
} finally { await stop(missing); }

const offlineOrigin = "http://127.0.0.1:3003";
const offline = await server(3003, { DATABASE_URL: "postgresql://unavailable:unavailable@127.0.0.1:59999/repair_empire", BETTER_AUTH_URL: offlineOrigin });
try {
  const result = await fetch(offlineOrigin + "/api/auth/sign-in/username", { method: "POST", headers: { origin: offlineOrigin, "content-type": "application/json", "x-forwarded-for": "198.21.1.1" }, body: JSON.stringify({ username: "unavailable", password: "QA-invalid-password" }) });
  assert.equal(result.status, 503);
  const failure = await result.json();
  assert.equal(failure.code, "ACCOUNT_SERVICE_UNAVAILABLE");
  assert.equal(JSON.stringify(failure).includes("postgresql://"), false);
  console.log("Disconnected production database: safe 503 without connection-string disclosure.");
} finally { await stop(offline); }
