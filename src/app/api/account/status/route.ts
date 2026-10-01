import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ characterCreated: false, preview: process.env.NODE_ENV === "development" });
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ message: "Unauthorized" }, { status: 401 });
  return Response.json({ characterCreated: Boolean(session.user.characterCreated) });
}
