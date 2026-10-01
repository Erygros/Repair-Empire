export const ASSET_REGISTRY: Record<string, { renderer: "CSS_LAYER"; token: string }> = {
  "character.outfit.basic": { renderer: "CSS_LAYER", token: "outfit-basic" },
  "character.outfit.dark": { renderer: "CSS_LAYER", token: "outfit-dark" },
  "character.outfit.orange": { renderer: "CSS_LAYER", token: "outfit-orange" },
  "character.headwear.cap": { renderer: "CSS_LAYER", token: "headwear-cap" },
  "character.accessory.glasses": { renderer: "CSS_LAYER", token: "accessory-glasses" },
  "building.theme.copper": { renderer: "CSS_LAYER", token: "building-copper" },
  "workstation.skin.prototype": { renderer: "CSS_LAYER", token: "bench-prototype" },
};

export function resolveAsset(assetReference: string) { return ASSET_REGISTRY[assetReference] ?? { renderer: "CSS_LAYER" as const, token: "asset-fallback" }; }
