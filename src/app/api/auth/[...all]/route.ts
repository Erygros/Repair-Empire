import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

async function unavailable() { return Response.json({ message: "Account service is not configured" }, { status: 503 }); }
let handlers: ReturnType<typeof toNextJsHandler> | null = null;
function getHandlers() { if (!process.env.DATABASE_URL) return null; return handlers ??= toNextJsHandler(getAuth()); }
export async function GET(request: Request) { const current = getHandlers(); return current ? current.GET(request) : unavailable(); }
export async function POST(request: Request) { const current = getHandlers(); return current ? current.POST(request) : unavailable(); }
