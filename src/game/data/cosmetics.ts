import type { CharacterAppearance, CosmeticDefinition } from "@/game/types";

export const DEFAULT_APPEARANCE: CharacterAppearance = { bodyPreset: "BALANCED", skinTone: "WARM", facePreset: "FOCUSED", hairStyle: "SHORT", hairColor: "BROWN" };

export const APPEARANCE_OPTIONS = {
  bodyPreset: ["COMPACT", "BALANCED", "TALL"],
  skinTone: ["LIGHT", "WARM", "MEDIUM", "DEEP"],
  facePreset: ["FOCUSED", "CALM", "BOLD"],
  hairStyle: ["SHORT", "CROP", "WAVES", "TIED"],
  hairColor: ["BLACK", "BROWN", "COPPER", "BLONDE", "SILVER"],
} as const;

export const COSMETICS: CosmeticDefinition[] = [
  { cosmeticId: "outfit-basic-workwear", name: "Basic Workwear", category: "OUTFIT", rarity: "COMMON", assetReference: "character.outfit.basic", equipSlot: "OUTFIT", sourceType: "DEFAULT", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "outfit-dark-technician", name: "Dark Technician", category: "OUTFIT", rarity: "UNCOMMON", assetReference: "character.outfit.dark", equipSlot: "OUTFIT", sourceType: "DEFAULT", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "outfit-orange-jacket", name: "Orange Workshop Jacket", category: "OUTFIT", rarity: "RARE", assetReference: "character.outfit.orange", equipSlot: "OUTFIT", sourceType: "PROGRESSION", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "headwear-technician-cap", name: "Technician Cap", category: "HEADWEAR", rarity: "COMMON", assetReference: "character.headwear.cap", equipSlot: "HEADWEAR", sourceType: "DEFAULT", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "accessory-safety-glasses", name: "Safety Glasses", category: "ACCESSORY", rarity: "UNCOMMON", assetReference: "character.accessory.glasses", equipSlot: "ACCESSORY", sourceType: "DEFAULT", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "theme-industrial-copper", name: "Industrial Copper", category: "BUILDING_THEME", rarity: "EPIC", assetReference: "building.theme.copper", equipSlot: null, sourceType: "SPECIAL", seasonAllowed: true, gameplayEffects: "NONE" },
  { cosmeticId: "workstation-season-prototype", name: "Prototype Bench", category: "WORKSTATION_SKIN", rarity: "LEGENDARY", assetReference: "workstation.skin.prototype", equipSlot: null, sourceType: "SEASON", seasonAllowed: true, gameplayEffects: "NONE" },
];

export const DEFAULT_COSMETIC_IDS = ["outfit-basic-workwear", "outfit-dark-technician", "headwear-technician-cap", "accessory-safety-glasses"];
export function getCosmetic(cosmeticId: string) { return COSMETICS.find((cosmetic) => cosmetic.cosmeticId === cosmeticId); }
