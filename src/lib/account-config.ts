import "server-only";

export class AccountServiceUnavailable extends Error {
  constructor(public readonly issues: string[]) {
    super("Account-Service ist noch nicht konfiguriert.");
  }
}

export function getAccountConfig() {
  const databaseURL = process.env.DATABASE_URL?.trim();
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const baseURL = process.env.BETTER_AUTH_URL?.trim();
  const issues: string[] = [];
  try {
    const url = new URL(databaseURL ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch { issues.push("DATABASE_URL fehlt oder ist keine PostgreSQL-URL"); }
  if (!secret || secret.length < 32 || secret.startsWith("replace-")) {
    issues.push("BETTER_AUTH_SECRET benötigt mindestens 32 zufällige Zeichen");
  }
  try {
    const url = new URL(baseURL ?? "");
    if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) throw new Error();
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error();
  } catch { issues.push("BETTER_AUTH_URL fehlt oder ist keine gültige Website-Origin"); }
  if (issues.length) throw new AccountServiceUnavailable(issues);
  return { databaseURL: databaseURL!, secret: secret!, baseURL: new URL(baseURL!).origin };
}

export function accountServiceError(error: unknown) {
  if (error instanceof AccountServiceUnavailable) {
    console.error("[account-service] Configuration:", error.issues.join("; "));
    return Response.json({ code: "ACCOUNT_SERVICE_NOT_CONFIGURED", message: error.message }, { status: 503 });
  }
  // Do not log connection strings, submitted passwords or raw database exceptions.
  console.error("[account-service] Database or authentication operation unavailable");
  return Response.json({ code: "ACCOUNT_SERVICE_UNAVAILABLE", message: "Account-Service derzeit nicht verfügbar." }, { status: 503 });
}
