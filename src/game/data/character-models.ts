export const CHARACTER_MODELS = {
  founder_male_01: { presentation: "MALE", label: "Männlich", source: "Nathan", path: "/models/founders/founder-male-01.glb", thumbnail: "/models/founders/founder-male-01.png", idle: null, walk: "WALK", height: 186.91312336590624, center: [-.760181427, 93.30541036, 4.040716746] as const, floor: -.151151323, compatibleCosmetics: [] as string[] },
  founder_female_01: { presentation: "FEMALE", label: "Weiblich", source: "Sophia", path: "/models/founders/founder-female-01.glb", thumbnail: "/models/founders/founder-female-01.png", idle: "IDLE", walk: null, height: 1.7841368190494424, center: [.008301559, .891341262, .047542542] as const, floor: -.000727147, compatibleCosmetics: [] as string[] },
} as const;
export type CharacterModelId = keyof typeof CHARACTER_MODELS;
export const CHARACTER_MODEL_IDS = ["founder_male_01", "founder_female_01"] as const;
export function isCharacterModelId(value: unknown): value is CharacterModelId { return typeof value === "string" && Object.hasOwn(CHARACTER_MODELS, value); }
export function resolveCharacterModel(character: { characterModelId?: unknown; model3d?: unknown } | null | undefined): CharacterModelId {
  if (isCharacterModelId(character?.characterModelId)) return character.characterModelId;
  const legacy = character?.model3d;
  if (legacy && typeof legacy === "object" && "presentation" in legacy && legacy.presentation === "MALE") return "founder_male_01";
  // Old local saves had no reliable presentation field; preserve the previous female default.
  return "founder_female_01";
}
export function cosmeticCompatible(modelId: CharacterModelId, cosmeticId: string) { return CHARACTER_MODELS[modelId].compatibleCosmetics.includes(cosmeticId); }
