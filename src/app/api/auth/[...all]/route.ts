import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { accountServiceError, getAccountConfig } from "@/lib/account-config";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { normalizeEmail, normalizeUsername } from "@/lib/account-validation";

export const runtime = "nodejs";
async function handle(request: Request) {
  try {
    const config = getAccountConfig();
    const origin = request.headers.get("origin");
    if (request.method === "POST" && origin && origin !== config.baseURL) return Response.json({ code: "INVALID_ORIGIN", message: "Invalid origin" }, { status: 403 });
    const registration = request.method === "POST" && new URL(request.url).pathname === "/api/auth/sign-up/email" ? await request.clone().json().catch(() => null) : null;
    const handlers = toNextJsHandler(getAuth());
    const response = await (request.method === "GET" ? handlers.GET(request) : handlers.POST(request));
    if (response.status >= 500) return accountServiceError(null);
    if (!response.ok && registration) {
      const failure = await response.clone().json().catch(() => null);
      // Better Auth hides insert errors. Distinguish a unique-constraint race from an unavailable database.
      if (failure?.code === "FAILED_TO_CREATE_USER") {
        const username = normalizeUsername(typeof registration.username === "string" ? registration.username : "");
        const email = normalizeEmail(typeof registration.email === "string" ? registration.email : "");
        const existing = await getDb().select({ username: users.normalizedUsername, email: users.normalizedEmail }).from(users).where(or(eq(users.normalizedUsername, username), eq(users.normalizedEmail, email)));
        if (existing.some(user => user.username === username)) return Response.json({ code: "USERNAME_IS_ALREADY_TAKEN", message: "Username bereits vergeben." }, { status: 409 });
        if (existing.some(user => user.email === email)) return Response.json({ code: "USER_ALREADY_EXISTS", message: "E-Mail bereits registriert." }, { status: 409 });
        return accountServiceError(null);
      }
    }
    return response;
  } catch (error) { return accountServiceError(error); }
}
export const GET = handle;
export const POST = handle;
