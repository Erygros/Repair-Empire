import { eq, and, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { getAccountConfig, accountServiceError } from "@/lib/account-config";
import { getDb } from "@/db";
import { users, sessions, rateLimit } from "@/db/schema";
import { normalizeEmail } from "@/lib/account-validation";
const payload = z.object({ email: z.string().trim().email().max(254), currentPassword: z.string().min(1).max(128) }).strict();
export const runtime = "nodejs";
export async function PATCH(request: Request) {
  try {
    if (request.headers.get("origin") !== getAccountConfig().baseURL) return Response.json({ message: "Ungültiger Ursprung." }, { status: 403 });
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Bitte erneut anmelden." }, { status: 401 });
    const parsed = payload.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: "Bitte E-Mail und aktuelles Passwort prüfen." }, { status: 400 });
    const now = Date.now();
    const [limit] = await getDb().insert(rateLimit).values({ id: crypto.randomUUID(), key: `account-email:${session.user.id}`, count: 1, lastRequest: now }).onConflictDoUpdate({ target: rateLimit.key, set: { count: sql`case when ${rateLimit.lastRequest} < ${now - 60000} then 1 else ${rateLimit.count} + 1 end`, lastRequest: sql`case when ${rateLimit.lastRequest} < ${now - 60000} then ${now} else ${rateLimit.lastRequest} end` } }).returning({ count: rateLimit.count });
    if (limit.count > 8) return Response.json({ message: "Zu viele Versuche. Bitte eine Minute warten." }, { status: 429 });
    // Better Auth checks the credential hash and a sufficiently fresh session.
    await auth.api.verifyPassword({ headers: request.headers, body: { password: parsed.data.currentPassword } });
    const email = normalizeEmail(parsed.data.email);
    await getDb().transaction(async tx => {
      await tx.update(users).set({ email, normalizedEmail: email, emailVerified: false, updatedAt: new Date() }).where(eq(users.id, session.user.id));
      await tx.delete(sessions).where(and(eq(sessions.userId, session.user.id), ne(sessions.id, session.session.id)));
    });
    return Response.json({ email });
  } catch (error) {
    if (error instanceof APIError) return Response.json({ message: "Passwort falsch oder Sitzung abgelaufen. Bitte erneut anmelden und versuchen." }, { status: 400 });
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return Response.json({ message: "Diese E-Mail ist bereits vergeben." }, { status: 409 });
    return accountServiceError(error);
  }
}
