import { getAuth } from "@/lib/auth";
import { accountServiceError, getAccountConfig } from "@/lib/account-config";
import { gameRateLimit, verifiedGame } from "@/lib/verified-game";
import { verifiedRequestSchema } from "@/game/logic/action-validation";
export const runtime = "nodejs";
const options = { headers: { "Cache-Control": "private, no-store" } };
async function handle(request: Request, write: boolean) {
  try {
    if (write && request.headers.get("origin") !== getAccountConfig().baseURL) return Response.json({ message: "Ungültiger Ursprung." }, { status: 403, ...options });
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session || session.user.accountStatus !== "ACTIVE" || !session.user.characterCreated) return Response.json({ message: "Bitte anmelden und Character erstellen." }, { status: 401, ...options });
    if (!await gameRateLimit(session.user.id)) return Response.json({ message: "Zu viele Aktionen. Bitte kurz warten." }, { status: 429, ...options });
    let input;
    if (write) {
      const raw = await request.text();
      if (raw.length > 2048) return Response.json({ message: "Anfrage zu groß." }, { status: 413, ...options });
      const parsed = verifiedRequestSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return Response.json({ message: "Ungültige Aktion." }, { status: 400, ...options });
      input = parsed.data;
    }
    const { status, ...result } = await verifiedGame(session.user.id, input);
    return Response.json(result, { status, ...options });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ message: "Ungültige Anfrage." }, { status: 400, ...options });
    return accountServiceError(error);
  }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
