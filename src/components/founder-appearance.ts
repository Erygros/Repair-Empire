import type { Character3DAppearance } from "@/components/character-3d";
import { resolveCharacterModel, CHARACTER_MODELS } from "@/game/data/character-models";
import type { PlayerCharacter } from "@/game/types";
export function getFounderAppearance(character: PlayerCharacter): Character3DAppearance {
  const male = CHARACTER_MODELS[resolveCharacterModel(character)].presentation === "MALE";
  return { presentation: male ? "MALE" : "FEMALE", height: 50, build: 50, shoulders: 50, arms: 50, chest: 50, torso: 50, waist: 50, hips: 50, legs: 50, skinTone: "WARM", headShape: "OVAL", eyeShape: "CALM", eyeColor: "BROWN", eyebrows: "NORMAL", nose: "STRAIGHT", mouth: "NEUTRAL", hair: male ? "SHORT" : "LONG", hairColor: "BROWN", outfit: "BASIC" };
}
