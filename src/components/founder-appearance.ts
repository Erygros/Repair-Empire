import type { Character3DAppearance } from "@/components/character-3d";
import type { PlayerCharacter } from "@/game/types";

export function getFounderAppearance(character: PlayerCharacter): Character3DAppearance {
  const saved = character.model3d && typeof character.model3d === "object" ? character.model3d as Partial<Character3DAppearance> : {};
  const a: Character3DAppearance = { presentation: "FEMALE", height: 50, build: 50, shoulders: 50, arms: 50, chest: 50, torso: 50, waist: 50, hips: 50, legs: 50, skinTone: character.appearance.skinTone === "LIGHT" ? "PORCELAIN" : character.appearance.skinTone, headShape: "OVAL", eyeShape: "CALM", eyeColor: "BROWN", eyebrows: "NORMAL", nose: "STRAIGHT", mouth: "NEUTRAL", hair: "SHORT", hairColor: character.appearance.hairColor, outfit: "ORANGE", ...saved };
  for (const key of ["height", "build", "shoulders", "arms", "chest", "torso", "waist", "hips", "legs"] as const) a[key] = typeof a[key] === "number" && Number.isFinite(a[key]) ? Math.min(100, Math.max(0, a[key])) : 50;
  return a;
}
