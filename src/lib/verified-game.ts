import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { characters, companies, leaderboardEntries } from "@/db/schema";
import { createInitialState, processOfflineProgress, runWorkstationTick } from "@/game/logic/game";
import { applyGameAction, type GameAction } from "@/game/logic/actions";
import { ensureDefaultCosmetics } from "@/game/logic/cosmetics";
import { updateFounderIdentity } from "@/game/logic/founder-model";
import { resolveCharacterModel } from "@/game/data/character-models";
import type { FounderSkill } from "@/game/data/founder-skills";
import type { GameState } from "@/game/types";

export function rankingValues(state: GameState) {
  const values = { companyLevel: state.companyLevel, companyXp: state.currentLevelXp, reputation: state.reputation, capital: state.money, customersServed: state.lifetimeStats.customersServed, successfulRepairs: state.lifetimeStats.repairsCompleted };
  if (Object.values(values).some(value => !Number.isSafeInteger(value) || value < 0) || state.companyLevel < 1) throw new Error("Invalid ranking state");
  return values;
}

export async function verifiedGame(accountId: string, input?: { activate?: true; revision?: number; action?: GameAction }) {
  return getDb().transaction(async tx => {
    // One company lock serializes actions, offline settlement and concurrent devices.
    const [company] = await tx.select().from(companies).where(eq(companies.accountId, accountId)).for("update");
    if (!company) return { status: 404, message: "Unternehmen fehlt." };
    const [character] = await tx.select().from(characters).where(eq(characters.id, company.characterId));
    const [entry] = await tx.select().from(leaderboardEntries).where(eq(leaderboardEntries.companyId, company.id));
    if (!entry && !input?.activate) return { status: 200, enabled: false };
    let state: GameState;
    if (entry) state = company.gameState as GameState;
    else {
      // Legacy local history cannot be reconstructed or trusted. Activation is explicit.
      state = ensureDefaultCosmetics(createInitialState(), Date.now());
      state.identity = { ...state.identity, accountId, companyId: company.id, characterId: character.id, companyName: "" };
      state.playerCharacter = { characterId: character.id, displayName: character.ceoName, appearance: { bodyPreset: "BALANCED", skinTone: "WARM", facePreset: "CALM", hairStyle: "SHORT", hairColor: "BROWN" }, equippedCosmetics: { OUTFIT: null, HEADWEAR: null, ACCESSORY: null }, createdAt: character.createdAt.getTime(), founderSkill: character.founderSkill as FounderSkill };
    }
    state.playerCharacter = { ...updateFounderIdentity(state.playerCharacter!, character.ceoName, resolveCharacterModel(character)), founderSkill: character.founderSkill as FounderSkill };
    const revision = entry?.revision ?? 0;
    if (entry && input?.revision !== undefined && input.revision !== revision) return { status: 409, enabled: true, state, revision, message: "Spielstand wurde aktualisiert. Bitte Aktion erneut ausführen." };
    const now = Date.now();
    const offline = processOfflineProgress(state, now, now - state.lastActiveAt >= 60000 ? "offline" : "automated");
    state = runWorkstationTick(offline.state, now).state;
    let notice: string | null = null;
    if (input?.action) {
      const result = applyGameAction(state, input.action, now);
      state = result.state;
      notice = result.notice;
    }
    state = { ...state, lastActiveAt: now, lastSavedAt: now };
    await tx.update(companies).set({ gameState: state, updatedAt: new Date(now) }).where(eq(companies.id, company.id));
    const nextRevision = revision + 1;
    await tx.insert(leaderboardEntries).values({ companyId: company.id, revision: nextRevision, ...rankingValues(state), updatedAt: new Date(now) }).onConflictDoUpdate({ target: leaderboardEntries.companyId, set: { ...rankingValues(state), revision: nextRevision, updatedAt: new Date(now) } });
    return { status: 200, enabled: true, state, revision: nextRevision, notice, offlineSummary: offline.summary };
  });
}

export async function gameRateLimit(accountId: string, scope = "verified-game", maximum = 120) {
  const result = await getDb().execute(sql`
    insert into rate_limit (id, key, count, last_request) values (${crypto.randomUUID()}, ${`${scope}:${accountId}`}, 1, ${Date.now()})
    on conflict (key) do update set count = case when rate_limit.last_request < ${Date.now() - 60000} then 1 else rate_limit.count + 1 end,
    last_request = case when rate_limit.last_request < ${Date.now() - 60000} then ${Date.now()} else rate_limit.last_request end returning count
  `);
  return Number(result[0].count) <= maximum;
}
