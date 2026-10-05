import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { accountServiceError, getAccountConfig } from "@/lib/account-config";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { characters, companies, users } from "@/db/schema";
import { createInitialState } from "@/game/logic/game";
import { ensureDefaultCosmetics, createPlayerCharacter } from "@/game/logic/cosmetics";
import { DEFAULT_APPEARANCE } from "@/game/data/cosmetics";
import { CHARACTER_MODELS, CHARACTER_MODEL_IDS } from "@/game/data/character-models";

export const runtime = "nodejs";
const identity = z.object({ ceoName: z.string().trim().min(2).max(24) }).strict();
const payload = identity.extend({ characterModelId: z.enum(CHARACTER_MODEL_IDS), founderSkill: z.enum(["FINANCE", "TECHNICIAN", "RESEARCHER", "MANAGER", "NEGOTIATOR"]) }).strict();

export async function GET() {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Unauthorized" }, { status: 401 });
    const [character] = await getDb().select({ id: characters.id, ceoName: characters.ceoName, characterModelId: characters.characterModelId, founderSkill: characters.founderSkill, createdAt: characters.createdAt }).from(characters).where(eq(characters.accountId, session.user.id));
    return character ? Response.json(character, { headers: { "Cache-Control": "no-store" } }) : Response.json({ message: "Character not found" }, { status: 404 });
  } catch (error) { return accountServiceError(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (request.headers.get("origin") !== getAccountConfig().baseURL) return Response.json({ message: "Invalid origin" }, { status: 403 });
    const parsed = identity.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: "Invalid character" }, { status: 400 });
    const result = await getDb().transaction(async tx => {
      const [updated] = await tx.update(characters).set({ ceoName: parsed.data.ceoName, updatedAt: new Date() }).where(eq(characters.accountId, session.user.id)).returning({ id: characters.id });
      if (!updated) return null;
      await tx.update(users).set({ ceoName: parsed.data.ceoName, updatedAt: new Date() }).where(eq(users.id, session.user.id));
      return updated;
    });
    return result ? Response.json(result) : Response.json({ message: "Character not found" }, { status: 404 });
  } catch (error) { return accountServiceError(error); }
}

export async function POST(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session || session.user.accountStatus !== "ACTIVE") return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (request.headers.get("origin") !== getAccountConfig().baseURL) return Response.json({ message: "Invalid origin" }, { status: 403 });
    const parsed = payload.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: "Invalid character" }, { status: 400 });
    const characterId = crypto.randomUUID(), companyId = crypto.randomUUID(), now = Date.now();
    const { ceoName, characterModelId, founderSkill } = parsed.data;
    const state = ensureDefaultCosmetics(createInitialState(), now);
    state.identity = { ...state.identity, accountId: session.user.id, characterId, companyId };
    state.playerCharacter = { ...createPlayerCharacter(ceoName, DEFAULT_APPEARANCE, "outfit-basic-workwear", now), characterId, characterModelId, founderSkill, equippedCosmetics: { OUTFIT: null, HEADWEAR: null, ACCESSORY: null } };
    await getDb().transaction(async tx => {
      await tx.insert(characters).values({ id: characterId, accountId: session.user.id, ceoName, characterModelId, presentation: CHARACTER_MODELS[characterModelId].presentation, appearance: {}, founderSkill });
      await tx.insert(companies).values({ id: companyId, accountId: session.user.id, characterId, gameState: state });
      await tx.update(users).set({ characterCreated: true, ceoName, updatedAt: new Date() }).where(eq(users.id, session.user.id));
    });
    return Response.json({ id: characterId, gameState: state });
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return Response.json({ message: "Character already exists" }, { status: 409 });
    return accountServiceError(error);
  }
}
