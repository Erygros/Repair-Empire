import test from "node:test";
import assert from "node:assert/strict";
import nextEnv from "@next/env";
import postgres from "postgres";
nextEnv.loadEnvConfig(process.cwd());
const base = process.env.BETTER_AUTH_URL, url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/repair_empire" || process.env.VERCEL) throw new Error("Local test database required");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
const username = `settings_${Date.now()}`, password = "Local-QA-password-2026!", nextPassword = "Local-QA-new-password-2026!";
async function request(path, body, cookie, method = "POST", origin = base) {
  const r = await fetch(base + path, { method, headers: { origin, "content-type": "application/json", "x-forwarded-for": "198.18.55.42", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: r.headers.getSetCookie().map(s => s.split(";")[0]).join("; ") };
}
test("Account settings enforce credentials, origin, uniqueness and session revocation", async () => {
  let userId, otherId;
  try {
    const signup = await request("/api/auth/sign-up/email", { username, email: `${username}@example.test`, emailConfirm: `${username}@example.test`, password, passwordConfirm: password, ceoName: "Settings QA", terms: true });
    assert.equal(signup.status, 200); userId = signup.json.user.id;
    let cookie = signup.cookie;
    const login = await request("/api/auth/sign-in/username", { username, password }); assert.equal(login.status, 200);
    const emailBody = { email: `new_${username}@example.test`, currentPassword: password };
    assert.equal((await request("/api/account/email", emailBody, undefined, "PATCH")).status, 401);
    assert.equal((await request("/api/account/email", emailBody, cookie, "PATCH", "https://invalid.test")).status, 403);
    assert.equal((await request("/api/account/email", { ...emailBody, currentPassword: "incorrect" }, cookie, "PATCH")).status, 400);
    assert.equal((await request("/api/account/email", { ...emailBody, email: "invalid" }, cookie, "PATCH")).status, 400);
    otherId = crypto.randomUUID();
    const otherEmail = `other_${username}@example.test`;
    await db`insert into "user" (id, name, email, username, display_username, normalized_username, normalized_email, ceo_name) values (${otherId}, 'Other QA', ${otherEmail}, ${'other_' + username}, ${'other_' + username}, ${'other_' + username}, ${otherEmail}, 'Other QA')`;
    assert.equal((await request("/api/account/email", { ...emailBody, email: otherEmail }, cookie, "PATCH")).status, 409);
    const changed = await request("/api/account/email", emailBody, cookie, "PATCH"); assert.equal(changed.status, 200);
    const [user] = await db`select email, normalized_email, email_verified from "user" where id = ${userId}`;
    assert.equal(user.email, emailBody.email); assert.equal(user.normalized_email, emailBody.email); assert.equal(user.email_verified, false);
    assert.equal((await db`select id from session where user_id = ${userId}`).length, 1);
    const second = await request("/api/auth/sign-in/username", { username, password }); assert.equal(second.status, 200);
    assert.equal((await request("/api/auth/change-password", { currentPassword: "wrong", newPassword: nextPassword, revokeOtherSessions: true }, cookie)).status, 400);
    const rotated = await request("/api/auth/change-password", { currentPassword: password, newPassword: nextPassword, revokeOtherSessions: true }, cookie); assert.equal(rotated.status, 200); cookie = rotated.cookie || cookie;
    assert.equal((await db`select id from session where user_id = ${userId}`).length, 1);
    assert.equal((await request("/api/auth/sign-in/username", { username, password })).status, 401);
    assert.equal((await request("/api/auth/sign-in/email", { email: emailBody.email, password: nextPassword })).status, 200);
    let limited;
    for (let i = 0; i < 9; i++) limited = await request("/api/account/email", { ...emailBody, currentPassword: "incorrect" }, cookie, "PATCH");
    assert.equal(limited.status, 429);
    assert.equal((await request("/api/auth/sign-out", {}, cookie)).status, 200);
  } finally {
    if (userId) { await db`delete from rate_limit where key = ${`account-email:${userId}`}`; await db`delete from "user" where id = ${userId}`; }
    if (otherId) await db`delete from "user" where id = ${otherId}`;
    await db.end();
  }
});
