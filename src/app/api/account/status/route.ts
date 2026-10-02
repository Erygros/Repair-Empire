import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { accountServiceError } from "@/lib/account-config";

export async function GET() {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Unauthorized" }, { status: 401 });
    return Response.json({ characterCreated: Boolean(session.user.characterCreated) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return accountServiceError(error); }
}
