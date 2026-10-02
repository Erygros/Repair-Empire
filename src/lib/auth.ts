import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { getAccountConfig } from "@/lib/account-config";
import { normalizeEmail, normalizeUsername, registrationSchema } from "@/lib/account-validation";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

const createAuth = () => {
  const config = getAccountConfig();
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { ...schema, user: schema.users, session: schema.sessions, account: schema.accounts, verification: schema.verifications }, transaction: true }),
    secret: config.secret,
    baseURL: config.baseURL,
    emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128, autoSignIn: true },
    user: { additionalFields: { ceoName: { type: "string", required: true, input: true }, normalizedUsername: { type: "string", required: false, input: false }, normalizedEmail: { type: "string", required: false, input: false }, accountStatus: { type: "string", required: false, defaultValue: "ACTIVE", input: false }, characterCreated: { type: "boolean", required: false, defaultValue: false, input: false } } },
    databaseHooks: { user: {
      create: { before: async user => ({ data: { ...user, normalizedUsername: normalizeUsername(typeof user.username === "string" ? user.username : ""), normalizedEmail: normalizeEmail(user.email) } }) },
      update: { before: async user => ({ data: { ...user, ...(typeof user.username === "string" ? { normalizedUsername: normalizeUsername(user.username) } : {}), ...(user.email !== undefined ? { normalizedEmail: normalizeEmail(user.email) } : {}) } }) },
    } },
    hooks: { before: createAuthMiddleware(async ctx => {
      if (ctx.path === "/sign-up/email") {
        const parsed = registrationSchema.safeParse(ctx.body);
        if (!parsed.success) throw new APIError("BAD_REQUEST", { code: "INVALID_REGISTRATION", message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." });
        const value = parsed.data;
        // Mutate the shared hook body; replacing the reference is not propagated by Better Auth.
        for (const key of Object.keys(ctx.body)) delete ctx.body[key];
        Object.assign(ctx.body, { email: value.email, password: value.password, name: value.ceoName, ceoName: value.ceoName, username: normalizeUsername(value.username), displayUsername: value.username });
      }
      if (ctx.path === "/sign-in/username" && typeof ctx.body.username === "string") ctx.body.username = normalizeUsername(ctx.body.username);
    }) },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30, customRules: { "/sign-in/username": { window: 60, max: 8 }, "/sign-in/email": { window: 60, max: 8 }, "/sign-up/email": { window: 300, max: 5 } } },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 24, immutableUsername: true, usernameNormalization: normalizeUsername, usernameValidator: (value) => /^[a-zA-Z0-9_-]+$/.test(value) }), nextCookies()],
  });
};

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth(): ReturnType<typeof createAuth> {
  if (!instance) instance = createAuth();
  return instance;
}
