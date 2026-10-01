import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
export async function getServerSession() { if (!process.env.DATABASE_URL) return null; try { const auth=getAuth(); return await auth.api.getSession({ headers: await headers() }); } catch { return null; } }
export async function requireSession() { const session=await getServerSession(); if(!session) redirect("/login"); return session; }
