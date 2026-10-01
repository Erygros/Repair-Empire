import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

const createAuth = () => betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128, autoSignIn: true },
    user: { additionalFields: { ceoName: { type: "string", required: true, input: true }, normalizedUsername: { type: "string", required: true, input: true }, normalizedEmail: { type: "string", required: true, input: true }, accountStatus: { type: "string", required: false, defaultValue: "ACTIVE", input: false }, characterCreated: { type: "boolean", required: false, defaultValue: false, input: false } } },
    rateLimit: { enabled: true, window: 60, max: 30, customRules: { "/sign-in/username": { window: 60, max: 8 }, "/sign-up/email": { window: 300, max: 5 } } },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 24, usernameValidator: (value) => /^[a-zA-Z0-9_-]+$/.test(value) }), nextCookies()],
  });

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth(): ReturnType<typeof createAuth> {
  if (!instance) instance = createAuth();
  return instance;
}
