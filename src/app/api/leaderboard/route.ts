import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { accountServiceError } from "@/lib/account-config";
import { readLeaderboard } from "@/lib/leaderboard";
import { gameRateLimit } from "@/lib/verified-game";
export const runtime = "nodejs";
const query = z.object({ sort: z.enum(["level", "reputation", "capital", "customers", "season"]).default("level"), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Bitte anmelden." }, { status: 401 });
    if (!await gameRateLimit(session.user.id, "leaderboard", 60)) return Response.json({ message: "Bitte kurz warten." }, { status: 429 });
    const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ message: "Ungültiger Filter." }, { status: 400 });
    const { sort, page } = parsed.data;
    const result = sort === "season" ? { season: null, rows: [], top: [], own: null, hasNext: false, page } : await readLeaderboard(session.user.id, sort, page);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return accountServiceError(error); }
}
