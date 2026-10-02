import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
export async function getServerSession() {
  const requestHeaders = await headers();
  try {
    const session = await getAuth().api.getSession({ headers: requestHeaders });
    return session?.user.accountStatus === "ACTIVE" ? session : null;
  } catch {
    console.error("[account-service] Session validation unavailable");
    return null;
  }
}
export async function requireSession() { const session=await getServerSession(); if(!session) redirect("/login"); return session; }
