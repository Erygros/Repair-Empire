import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import postgres from "postgres";
import { verifyPassword } from "better-auth/crypto";

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.BETTER_AUTH_URL;
const target = new URL(process.env.DATABASE_URL ?? "http://invalid");
// These tests create and remove only their own records, and never run against production.
if (!["localhost", "127.0.0.1"].includes(target.hostname) || target.pathname !== "/repair_empire" || process.env.VERCEL) {
  throw new Error("Auth integration tests require the dedicated local repair_empire database.");
}
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const suffix = randomBytes(4).toString("hex");
const username = "qat_" + suffix;
const email = username + "@example.test";
const password = randomBytes(20).toString("base64url");
const signup = { username, email, emailConfirm: email, password, passwordConfirm: password, ceoName: "Test CEO", name: "Test CEO", terms: true };
let requestNumber = 0;
async function request(path, { body, cookie, method, origin = base, ip } = {}) {
  const response = await fetch(base + path, {
    method: method ?? (body ? "POST" : "GET"), redirect: "manual",
    headers: { origin, "content-type": "application/json", "x-forwarded-for": ip ?? "198.18." + Number.parseInt(suffix.slice(0, 2), 16) + "." + (++requestNumber % 250 + 1), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  const cookies = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  return { response, json, text, cookie: cookies };
}
async function expectRedirect(path, destination, cookie) {
  const result = await request(path, { cookie });
  assert.ok([303, 307, 308].includes(result.response.status), path + " must redirect");
  assert.equal(new URL(result.response.headers.get("location"), base).pathname, destination);
}

test("Real PostgreSQL account lifecycle", async t => {
  let cookie, userId;
  try {
    await t.test("anonymous protected pages and APIs", async () => {
      for (const path of ["/play", "/create-character", "/account"]) await expectRedirect(path, "/login");
      assert.equal((await request("/api/account/status")).response.status, 401);
      assert.equal((await request("/api/character", { body: {} })).response.status, 401);
    });
    for (const [label, invalid] of [
      ["missing username", { username: "" }],
      ["missing CEO name", { ceoName: "" }],
      ["invalid email", { email: "bad", emailConfirm: "bad" }],
      ["email confirmation", { emailConfirm: "other@example.test" }],
      ["short password", { password: "short", passwordConfirm: "short" }],
      ["password confirmation", { passwordConfirm: "different" }],
      ["missing legal agreement", { terms: false }],
    ]) await t.test("rejects " + label + " server-side", async () => {
      const result = await request("/api/auth/sign-up/email", { body: { ...signup, ...invalid } });
      assert.equal(result.response.status, 400);
      assert.equal((await sql`select id from "user" where email = ${email}`).length, 0);
    });
    await t.test("registration creates normalized user, hash and session atomically", async () => {
      const result = await request("/api/auth/sign-up/email", { body: { ...signup, username: username.toUpperCase(), email: email.toUpperCase(), emailConfirm: email.toUpperCase(), normalizedUsername: "forged", normalizedEmail: "forged", characterCreated: true } });
      assert.equal(result.response.status, 200);
      cookie = result.cookie;
      assert.ok(cookie.includes("session_token="));
      assert.ok(result.response.headers.get("set-cookie").includes("HttpOnly"));
      assert.ok(result.response.headers.get("set-cookie").includes("SameSite=Lax"));
      if (process.env.NODE_ENV === "production") assert.ok(result.response.headers.get("set-cookie").includes("Secure"));
      assert.equal(JSON.stringify(result.json).includes(password), false);
      const [user] = await sql`select * from "user" where email = ${email}`;
      assert.ok(user);
      userId = user.id;
      assert.equal(user.username, username);
      assert.equal(user.normalized_username, username);
      assert.equal(user.normalized_email, email);
      assert.equal(user.ceo_name, "Test CEO");
      assert.equal(user.character_created, false);
      assert.equal("password_confirm" in user, false);
      const [account] = await sql`select * from account where user_id = ${userId}`;
      assert.notEqual(account.password, password);
      assert.equal(await verifyPassword({ hash: account.password, password }), true);
      assert.equal((await sql`select id from session where user_id = ${userId}`).length, 1);
    });
    await t.test("registration leads to creator with pending CEO name", async () => {
      await expectRedirect("/play", "/create-character", cookie);
      const creator = await request("/create-character", { cookie });
      assert.equal(creator.response.status, 200);
      assert.ok(creator.text.includes("Test CEO"));
      assert.equal((await request("/api/account/status", { cookie })).json.characterCreated, false);
    });
    for (const [label, fields] of [
      ["duplicate username", { email: "different_" + email, emailConfirm: "different_" + email }],
      ["case-insensitive username", { username: username.toUpperCase(), email: "different_" + email, emailConfirm: "different_" + email }],
      ["duplicate email", { username: "other_" + suffix }],
      ["case-insensitive email", { username: "other_" + suffix, email: email.toUpperCase(), emailConfirm: email.toUpperCase() }],
    ]) await t.test(label, async () => {
      const result = await request("/api/auth/sign-up/email", { body: { ...signup, ...fields } });
      assert.ok([400, 409, 422].includes(result.response.status));
    });
    await t.test("database case-insensitive indexes cannot be bypassed", async () => {
      await assert.rejects(sql`insert into "user" (id,name,email,username,display_username,normalized_username,normalized_email,ceo_name) values (${"qat_" + suffix + "_index"},'Test',${"index_" + email},${username.toUpperCase()},'Test',${"other_" + suffix},${"index_" + email},'Test')`, error => error.code === "23505");
    });
    await t.test("concurrent duplicate registrations create one account", async () => {
      const race = { ...signup, username: "race_" + suffix, email: "race_" + email, emailConfirm: "race_" + email };
      const results = await Promise.all([request("/api/auth/sign-up/email", { body: race }), request("/api/auth/sign-up/email", { body: { ...race, username: race.username.toUpperCase() } })]);
      assert.equal(results.filter(result => result.response.status === 200).length, 1);
      assert.equal((await sql`select id from "user" where email = ${race.email}`).length, 1);
    });
    await t.test("wrong password and unknown username", async () => {
      for (const body of [{ username, password: "wrong-password" }, { username: "unknown_" + suffix, password }]) {
        assert.equal((await request("/api/auth/sign-in/username", { body })).response.status, 401);
      }
    });
    await t.test("failed credential insert rolls back the user and session", async () => {
      const functionName = "qat_reject_" + suffix;
      const failedUsername = "fail_" + suffix;
      const failedEmail = failedUsername + "@example.test";
      try {
        await sql.unsafe('CREATE FUNCTION "' + functionName + '"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (SELECT 1 FROM "user" WHERE id = NEW.user_id AND username = ' + "'" + failedUsername + "'" + ') THEN RAISE EXCEPTION ' + "'Intentional local test failure'" + '; END IF; RETURN NEW; END $$');
        await sql.unsafe('CREATE TRIGGER "' + functionName + '" BEFORE INSERT ON account FOR EACH ROW EXECUTE FUNCTION "' + functionName + '"()');
        const result = await request("/api/auth/sign-up/email", { body: { ...signup, username: failedUsername, email: failedEmail, emailConfirm: failedEmail } });
        assert.equal(result.response.status, 503);
        assert.equal(result.json.code, "ACCOUNT_SERVICE_UNAVAILABLE");
        assert.equal((await sql`select id from "user" where email = ${failedEmail}`).length, 0);
        assert.equal(result.cookie.includes("session_token="), false);
        assert.equal(result.text.includes("Intentional local test failure"), false);
      } finally {
        await sql.unsafe('DROP TRIGGER IF EXISTS "' + functionName + '" ON account');
        await sql.unsafe('DROP FUNCTION IF EXISTS "' + functionName + '"()');
      }
    });
    await t.test("logout revokes server session and protects pages", async () => {
      assert.equal((await request("/api/auth/sign-out", { body: {}, cookie })).response.status, 200);
      assert.equal((await sql`select id from session where user_id = ${userId}`).length, 0);
      await expectRedirect("/play", "/login", cookie);
    });
    await t.test("case-insensitive username login before character", async () => {
      const result = await request("/api/auth/sign-in/username", { body: { username: " " + username.toUpperCase() + " ", password } });
      assert.equal(result.response.status, 200);
      cookie = result.cookie;
      await expectRedirect("/play", "/create-character", cookie);
    });
    await t.test("CSRF rejects foreign registration and character creation origins", async () => {
      assert.equal((await request("/api/auth/sign-up/email", { origin: "https://foreign.example", body: signup })).response.status, 403);
      assert.equal((await request("/api/character", { origin: "https://foreign.example", body: {}, cookie })).response.status, 403);
    });
    await t.test("character and company persist, then creator redirects to play", async () => {
      const body = { ceoName: "Test CEO", characterModelId: "founder_female_01", founderSkill: "TECHNICIAN" };
      const result = await request("/api/character", { body, cookie });
      assert.equal(result.response.status, 200);
      assert.equal((await sql`select id from character where account_id = ${userId}`).length, 1);
      assert.equal((await sql`select id from company where account_id = ${userId}`).length, 1);
      assert.equal((await request("/api/account/status", { cookie })).json.characterCreated, true);
      await expectRedirect("/create-character", "/play", cookie);
      assert.equal((await request("/play", { cookie })).response.status, 200);
      assert.equal((await request("/api/character", { body, cookie })).response.status, 409);
    });
    await t.test("CEO name edits preserve permanent model, skill and legacy data", async () => {
      const [before] = await sql`select * from character where account_id = ${userId}`;
      const body = {ceoName:"Updated CEO"};
      assert.equal((await request("/api/character",{method:"PATCH",body})).response.status,401);
      assert.equal((await request("/api/character",{method:"PATCH",body,cookie,origin:"https://foreign.example"})).response.status,403);
      assert.equal((await request("/api/character",{method:"PATCH",body:{...body,founderSkill:"FINANCE"},cookie})).response.status,400);
      assert.equal((await request("/api/character",{method:"PATCH",body:{...body,appearance:{height:200}},cookie})).response.status,400);
      assert.equal((await request("/api/character",{method:"PATCH",body:{...body,characterModelId:"founder_male_01"},cookie})).response.status,400);
      assert.equal((await request("/api/character",{method:"PATCH",body,cookie})).response.status,200);
      const [after] = await sql`select * from character where account_id = ${userId}`;
      assert.equal(after.id,before.id);assert.equal(after.founder_skill,before.founder_skill);assert.equal(after.ceo_name,"Updated CEO");assert.deepEqual(after.appearance,before.appearance);assert.equal(after.character_model_id,before.character_model_id);
      assert.equal((await sql`select ceo_name from "user" where id = ${userId}`)[0].ceo_name,"Updated CEO");
      assert.equal((await sql`select id from company where account_id = ${userId}`).length,1);
    });
    await t.test("login with existing character routes to play", async () => {
      await request("/api/auth/sign-out", { body: {}, cookie });
      const result = await request("/api/auth/sign-in/username", { body: { username, password } });
      assert.equal(result.response.status, 200);
      cookie = result.cookie;
      assert.equal((await request("/api/account/status", { cookie })).json.characterCreated, true);
      await expectRedirect("/create-character", "/play", cookie);
    });
    await t.test("expired and tampered sessions cannot open protected pages", async () => {
      await sql`update session set expires_at = timestamp '2000-01-01' where user_id = ${userId}`;
      for (const path of ["/play", "/create-character", "/account"]) await expectRedirect(path, "/login", cookie);
      await expectRedirect("/play", "/login", cookie + "tampered");
    });
    await t.test("database-backed login rate limit survives separate requests", async () => {
      const statuses = [];
      const rateIP = "198.19." + Number.parseInt(suffix.slice(0, 2), 16) + "." + Number.parseInt(suffix.slice(2, 4), 16);
      for (let index = 0; index < 9; index++) statuses.push((await request("/api/auth/sign-in/username", { body: { username, password: "wrong-password" }, ip: rateIP })).response.status);
      assert.equal(statuses.at(-1), 429);
      assert.ok((await sql`select id from rate_limit`).length > 0);
    });
    await t.test("registration rate limit applies even to invalid submissions", async () => {
      const rateIP = "198.19." + Number.parseInt(suffix.slice(4, 6), 16) + "." + Number.parseInt(suffix.slice(6, 8), 16);
      let last;
      for (let index = 0; index < 6; index++) last = await request("/api/auth/sign-up/email", { body: { ...signup, username: "" }, ip: rateIP });
      assert.equal(last.response.status, 429);
      assert.ok(last.response.headers.get("x-retry-after"));
    });
  } finally {
    await sql`delete from "user" where email in (${email}, ${"race_" + email}, ${"different_" + email}) or username = ${"other_" + suffix}`;
    await sql.end();
  }
});
