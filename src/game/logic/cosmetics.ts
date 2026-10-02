import { DEFAULT_APPEARANCE, DEFAULT_COSMETIC_IDS, getCosmetic } from "@/game/data/cosmetics";
import type { CharacterAppearance, CharacterCosmeticSlot, CosmeticSourceType, GameState, PlayerCharacter } from "@/game/types";

export function normalizeCharacterName(value: string) { return value.trim().replace(/\s+/g, " ").slice(0, 24); }
export function validateCharacterName(value: string) { const name = normalizeCharacterName(value); return name.length >= 2 ? null : "Name muss mindestens 2 Zeichen besitzen"; }

export function createPlayerCharacter(displayName: string, appearance: CharacterAppearance, outfitId: string, now: number): PlayerCharacter {
  return { characterId: `FOUNDER-${now.toString(36)}`, displayName: normalizeCharacterName(displayName), appearance: { ...DEFAULT_APPEARANCE, ...appearance }, equippedCosmetics: { OUTFIT: outfitId, HEADWEAR: null, ACCESSORY: null }, createdAt: now };
}

export function grantCosmetic(state: GameState, cosmeticId: string, sourceType: CosmeticSourceType, now: number) {
  if (!getCosmetic(cosmeticId) || state.cosmeticEntitlements.some((entry) => entry.cosmeticId === cosmeticId)) return { state, unlocked: false };
  return { state: { ...state, cosmeticEntitlements: [...state.cosmeticEntitlements, { cosmeticId, grantedAt: now, sourceType, authority: "LOCAL_DEVELOPMENT" as const }], cosmeticUnlockNotice: cosmeticId }, unlocked: true };
}

export function ensureDefaultCosmetics(state: GameState, now: number) {
  const granted = DEFAULT_COSMETIC_IDS.reduce((current, cosmeticId) => grantCosmetic(current, cosmeticId, "DEFAULT", now).state, state);
  // Starter equipment should not interrupt the first visit with a reward modal.
  return { ...granted, cosmeticUnlockNotice: state.cosmeticUnlockNotice };
}

export function equipCosmetic(state: GameState, cosmeticId: string) {
  const cosmetic = getCosmetic(cosmeticId);
  if (!state.playerCharacter) return { state, error: "Founder Character fehlt" };
  if (!cosmetic?.equipSlot) return { state, error: "Cosmetic kann nicht am Character ausgerüstet werden" };
  if (!state.cosmeticEntitlements.some((entry) => entry.cosmeticId === cosmeticId)) return { state, error: "Cosmetic ist nicht freigeschaltet" };
  return { state: { ...state, playerCharacter: { ...state.playerCharacter, equippedCosmetics: { ...state.playerCharacter.equippedCosmetics, [cosmetic.equipSlot]: cosmeticId } } }, error: null };
}

export function unequipCosmetic(state: GameState, slot: CharacterCosmeticSlot) {
  if (!state.playerCharacter) return state;
  if (slot === "OUTFIT") return state;
  return { ...state, playerCharacter: { ...state.playerCharacter, equippedCosmetics: { ...state.playerCharacter.equippedCosmetics, [slot]: null } } };
}
