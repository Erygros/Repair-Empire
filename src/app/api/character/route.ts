import { accountServiceError, getAccountConfig } from "@/lib/account-config";
import { headers } from "next/headers"; import { eq } from "drizzle-orm"; import { z } from "zod"; import { getAuth } from "@/lib/auth"; import { getDb } from "@/db"; import { characters,companies,users } from "@/db/schema"; import { createInitialState } from "@/game/logic/game";
const appearance=z.object({presentation:z.enum(["MALE","FEMALE"]),height:z.number().min(0).max(100),build:z.number().min(0).max(100),shoulders:z.number().min(0).max(100),arms:z.number().min(0).max(100),chest:z.number().min(0).max(100),torso:z.number().min(0).max(100),waist:z.number().min(0).max(100),hips:z.number().min(0).max(100),legs:z.number().min(0).max(100),skinTone:z.enum(["PORCELAIN","WARM","MEDIUM","DEEP","DARK"]),headShape:z.enum(["NARROW","OVAL","ROUND","ANGULAR","WIDE"]),eyeShape:z.string().max(20),eyeColor:z.string().max(20),eyebrows:z.string().max(20),nose:z.string().max(20),mouth:z.string().max(20),hair:z.enum(["BUZZ","SHORT","SIDE","MEDIUM","LONG","SLICK","CURLY"]),hairColor:z.enum(["BLACK","BROWN","COPPER","BLONDE","SILVER"]),outfit:z.enum(["BASIC","DARK","ORANGE"])});const payload=z.object({ceoName:z.string().trim().min(2).max(24),appearance,founderSkill:z.enum(["FINANCE","TECHNICIAN","RESEARCHER","MANAGER","NEGOTIATOR"])});
export const runtime = "nodejs";
export async function PATCH(request:Request) {
  try {
    const session = await getAuth().api.getSession({headers:await headers()});
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({message:"Unauthorized"},{status:401});
    if (request.headers.get("origin") !== getAccountConfig().baseURL) return Response.json({message:"Invalid origin"},{status:403});
    const parsed = payload.omit({founderSkill:true}).strict().safeParse(await request.json().catch(()=>null));
    if (!parsed.success) return Response.json({message:"Invalid character"},{status:400});
    const result = await getDb().transaction(async tx => {
      const updated = await tx.update(characters).set({ceoName:parsed.data.ceoName,presentation:parsed.data.appearance.presentation,appearance:parsed.data.appearance,updatedAt:new Date()}).where(eq(characters.accountId,session.user.id)).returning({id:characters.id});
      if (!updated.length) return null;
      await tx.update(users).set({ceoName:parsed.data.ceoName,updatedAt:new Date()}).where(eq(users.id,session.user.id));
      return updated[0];
    });
    return result ? Response.json(result) : Response.json({message:"Character not found"},{status:404});
  } catch (error) { return accountServiceError(error); }
}
export async function POST(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Unauthorized" }, { status: 401 });
    const origin = request.headers.get("origin");
    if (!origin || origin !== getAccountConfig().baseURL) return Response.json({ message: "Invalid origin" }, { status: 403 });
    const parsed = payload.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: "Invalid character" }, { status: 400 });
    const db = getDb(), characterId = crypto.randomUUID(), companyId = crypto.randomUUID();
    await db.transaction(async tx => {
      await tx.insert(characters).values({ id: characterId, accountId: session.user.id, ceoName: parsed.data.ceoName, presentation: parsed.data.appearance.presentation, appearance: parsed.data.appearance, founderSkill: parsed.data.founderSkill });
      await tx.insert(companies).values({ id: companyId, accountId: session.user.id, characterId, gameState: createInitialState() });
      await tx.update(users).set({ characterCreated: true, ceoName: parsed.data.ceoName, updatedAt: new Date() }).where(eq(users.id, session.user.id));
    });
    return Response.json({ id: characterId });
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return Response.json({ message: "Character already exists" }, { status: 409 });
    return accountServiceError(error);
  }
}
