export { BRAND_ASSETS, ICON_SIZES } from "./brand-assets";
export { CHARACTER_MODELS as CHARACTER_MODEL_ASSETS } from "./character-models";
export const ASSET_REGISTRY: Record<string, { renderer: "CSS_LAYER"; token: string }> = {
  "character.outfit.basic": { renderer: "CSS_LAYER", token: "outfit-basic" },
  "character.outfit.dark": { renderer: "CSS_LAYER", token: "outfit-dark" },
  "character.outfit.orange": { renderer: "CSS_LAYER", token: "outfit-orange" },
  "character.headwear.cap": { renderer: "CSS_LAYER", token: "headwear-cap" },
  "character.accessory.glasses": { renderer: "CSS_LAYER", token: "accessory-glasses" },
  "building.theme.copper": { renderer: "CSS_LAYER", token: "building-copper" },
  "workstation.skin.prototype": { renderer: "CSS_LAYER", token: "bench-prototype" },
  "device.smartphone.prototype": { renderer: "CSS_LAYER", token: "device-phone" },
  "device.controller.prototype": { renderer: "CSS_LAYER", token: "device-controller" },
  "device.handheld.prototype": { renderer: "CSS_LAYER", token: "device-handheld" },
  "device.console.prototype": { renderer: "CSS_LAYER", token: "device-console" },
  "device.tablet.prototype": { renderer: "CSS_LAYER", token: "device-tablet" },
  "device.laptop.prototype": { renderer: "CSS_LAYER", token: "device-laptop" },
  "device.audio.prototype": { renderer: "CSS_LAYER", token: "device-audio" },
  "tool.multimeter.prototype": { renderer: "CSS_LAYER", token: "tool-meter" },
  "tool.soldering.prototype": { renderer: "CSS_LAYER", token: "tool-solder" },
  "effect.diagnostic.prototype": { renderer: "CSS_LAYER", token: "effect-diagnostic" },
  "audio.ui.prototype": { renderer: "CSS_LAYER", token: "audio-synth-ui" },
  "audio.reward.prototype": { renderer: "CSS_LAYER", token: "audio-synth-reward" },
};

export function resolveAsset(assetReference: string) { return ASSET_REGISTRY[assetReference] ?? { renderer: "CSS_LAYER" as const, token: "asset-fallback" }; }
