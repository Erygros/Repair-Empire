import test from "node:test";
import assert from "node:assert/strict";
import nextEnv from "@next/env";
import postgres from "postgres";
import { loadGameModule } from "./helpers/game-loader.mjs";
nextEnv.loadEnvConfig(process.cwd());
const base = process.env.BETTER_AUTH_URL, url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/repair_empire" || process.env.VERCEL) throw Error("Local test database required");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
const prefix = `ranking_${Date.now()}`, ids = [];
const testIP = `198.18.95.${Date.now() % 200 + 1}`;
const { createInitialState } = loadGameModule("src/game/logic/game.ts");
const appearance = { presentation: "MALE", height: 50, build: 50, shoulders: 50, arms: 50, chest: 50, torso: 50, waist: 50, hips: 50, legs: 50, skinTone: "WARM", headShape: "OVAL", eyeShape: "CALM", eyeColor: "BROWN", eyebrows: "NORMAL", nose: "STRAIGHT", mouth: "NEUTRAL", hair: "SHORT", hairColor: "BROWN", outfit: "ORANGE" };
async function request(path, body, cookie, origin = base) {
  const response = await fetch(base + path, { method: body === undefined ? "GET" : "POST", headers: { origin, "content-type": "application/json", "x-forwarded-for": testIP, ...(cookie ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, json: await response.json(), cookie: response.headers.getSetCookie().map(s => s.split(";")[0]).join("; ") };
}
test("server ranking sorts, paginates, hides private data and protects verified actions", async () => {
  let ownId;
  try {
    assert.equal((await request("/api/leaderboard")).status, 401);
    const anonymousPage = await fetch(base + "/leaderboard", { redirect: "manual" });
    assert.equal(anonymousPage.status, 307); assert.equal(anonymousPage.headers.get("location"), "/login");
    const signup = await request("/api/auth/sign-up/email", { username: prefix, email: `${prefix}@example.test`, emailConfirm: `${prefix}@example.test`, password: "Local-Ranking-2026!", passwordConfirm: "Local-Ranking-2026!", ceoName: "Ranking QA", terms: true });
    assert.equal(signup.status, 200); ownId = signup.json.user.id; ids.push(ownId); const cookie = signup.cookie;
    assert.equal((await request("/api/character", { ceoName: "My CEO", characterModelId: "founder_male_01", founderSkill: "TECHNICIAN" }, cookie)).status, 200);
    assert.equal((await request("/api/game/verified", undefined, cookie)).json.enabled, false);
    assert.equal((await request("/api/game/verified", { activate: true }, cookie, "https://invalid.test")).status, 403);
    assert.equal((await request("/api/game/verified", { activate: true })).status, 401);
    let verified = await request("/api/game/verified", { activate: true }, cookie); assert.equal(verified.status, 200);
    for (const payload of [{ level: 100000, capital: 1e15 }, { activate: true, money: 1e12 }, { revision: verified.json.revision, action: { type: "completeRepair", workstationId: "WS-01", endsAt: 0 } }]) assert.equal((await request("/api/game/verified", payload, cookie)).status, 400);
    const fixtures = [];
    for (let i = 0; i < 62; i++) {
      const id = `${prefix}-${String(i).padStart(3, "0")}`, characterId = `character-${id}`, companyId = `company-${id}`, email = `${id}@example.test`;
      ids.push(id); const state = createInitialState();
      const values = { companyLevel: i === 0 ? 100000 : i < 4 ? 50 : 10, companyXp: i === 2 ? 200 : 100, reputation: i === 3 ? 500 : 100, capital: i === 1 ? Number.MAX_SAFE_INTEGER - 100 : 1e12 + i, customersServed: i === 4 ? 1000 : 10, successfulRepairs: i };
      if (i === 5 || i === 6) { values.successfulRepairs = 42; values.capital = 1e12 + 5; }
      const ceoName = `CEO ${i}`; fixtures.push({ ...values, ceoName, companyId });
      await db`insert into "user" (id,name,email,username,display_username,normalized_username,normalized_email,ceo_name,character_created) values (${id},${'PRIVATE-'+i},${email},${id},${id},${id},${email},${ceoName},true)`;
      await db`insert into character (id,account_id,ceo_name,presentation,appearance,founder_skill) values (${characterId},${id},${ceoName},'MALE',${db.json(appearance)},'TECHNICIAN')`;
      await db`insert into company (id,account_id,character_id,game_state) values (${companyId},${id},${characterId},${db.json(state)})`;
      await db`insert into leaderboard_entry (company_id,company_level,company_xp,reputation,capital,customers_served,successful_repairs) values (${companyId},${values.companyLevel},${values.companyXp},${values.reputation},${values.capital},${values.customersServed},${values.successfulRepairs})`;
    }
    const first = await request("/api/leaderboard?sort=level&page=1", undefined, cookie); assert.equal(first.status, 200);
    assert.equal(first.json.rows.length, 50); assert.equal(first.json.own.rank, 63); assert.equal(first.json.top[0].companyLevel, 100000);
    assert.deepEqual(first.json.top.map(row => row.ceoName), ["CEO 0", "CEO 2", "CEO 3"]);
    const second = await request("/api/leaderboard?sort=level&page=2", undefined, cookie);
    assert.equal(second.json.rows.length, 13); assert.equal(second.json.hasNext, false);
    const names = [...first.json.rows, ...second.json.rows].map(row => row.ceoName); assert.equal(new Set(names).size, 63);
    assert.deepEqual((await request("/api/leaderboard?sort=level&page=1", undefined, cookie)).json.rows, first.json.rows);
    assert.equal((await request("/api/leaderboard?sort=reputation", undefined, cookie)).json.top[0].ceoName, "CEO 3");
    assert.equal((await request("/api/leaderboard?sort=capital", undefined, cookie)).json.top[0].ceoName, "CEO 1");
    assert.equal((await request("/api/leaderboard?sort=customers", undefined, cookie)).json.top[0].ceoName, "CEO 4");
    for (const [sort, fields] of Object.entries({ level: ["companyLevel", "companyXp", "reputation"], reputation: ["reputation", "companyLevel", "successfulRepairs"], capital: ["capital"], customers: ["customersServed", "successfulRepairs"] })) {
      const expected = [...fixtures].sort((a, b) => { for (const field of fields) { if (a[field] !== b[field]) return b[field] - a[field]; } return a.companyId < b.companyId ? -1 : 1; }).map(row => row.ceoName);
      const p1 = (await request(`/api/leaderboard?sort=${sort}&page=1`, undefined, cookie)).json;
      const p2 = (await request(`/api/leaderboard?sort=${sort}&page=2`, undefined, cookie)).json;
      assert.deepEqual([...p1.rows, ...p2.rows].filter(row => !row.own).map(row => row.ceoName), expected);
    }
    const serialized = JSON.stringify(first.json); for (const forbidden of ["email", "password", "username", "accountId", "companyId", "session", prefix, "PRIVATE-"]) assert.ok(!serialized.includes(forbidden), forbidden);
    await db`update "user" set account_status = 'BANNED' where id = ${ids[1]}`;
    assert.notEqual((await request("/api/leaderboard?sort=level", undefined, cookie)).json.top[0].ceoName, "CEO 0");
    await db`update "user" set character_created = false where id = ${ids[2]}`;
    assert.ok(!(await request("/api/leaderboard?sort=capital", undefined, cookie)).json.top.some(row => row.ceoName === "CEO 1"));
    assert.equal((await request("/api/leaderboard?sort=season", undefined, cookie)).json.season, null);
    assert.equal((await request("/api/leaderboard?sort=invalid", undefined, cookie)).status, 400);
    verified = await request("/api/game/verified", undefined, cookie);
    const stationId = verified.json.state.workstations[0].id, orderId = verified.json.state.availableOrders[0].id;
    let result = await request("/api/game/verified", { revision: verified.json.revision, action: { type: "assignOrder", workstationId: stationId, orderId } }, cookie); assert.equal(result.status, 200);
    const early = await request("/api/game/verified", { revision: result.json.revision, action: { type: "completeRepair", workstationId: stationId } }, cookie);
    assert.equal(early.json.state.lifetimeStats.repairsCompleted, 0);
    const state = early.json.state; state.workstations[0].activeRepair.endsAt = Date.now() - 1;
    await db`update company set game_state = ${db.json(state)} where account_id = ${ownId}`;
    const command = { revision: early.json.revision, action: { type: "completeRepair", workstationId: stationId } };
    const concurrent = await Promise.all([request("/api/game/verified", command, cookie), request("/api/game/verified", command, cookie)]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]); const success = concurrent.find(r => r.status === 200);
    assert.equal(success.json.state.lifetimeStats.repairsCompleted, 1); assert.equal(success.json.state.lifetimeStats.customersServed, 1);
    const replay = await request("/api/game/verified", { revision: success.json.revision, action: command.action }, cookie);
    assert.equal(replay.json.state.money, success.json.state.money); assert.equal(replay.json.state.lifetimeStats.repairsCompleted, 1);
    assert.equal((await request("/api/game/verified", { activate: true }, cookie)).json.state.money, success.json.state.money);
    const ownRank = await request("/api/leaderboard?sort=customers", undefined, cookie); assert.equal(ownRank.json.own.customersServed, 1);
    const indices = await db`select indexname from pg_indexes where tablename = 'leaderboard_entry'`; assert.equal(indices.filter(row => row.indexname.startsWith('leaderboard_') && row.indexname.endsWith('_idx')).length, 4);
  } finally {
    for (const id of ids) { await db`delete from rate_limit where key in (${`leaderboard:${id}`}, ${`verified-game:${id}`})`; await db`delete from "user" where id = ${id}`; }
    await db.end();
  }
});
