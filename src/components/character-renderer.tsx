import { memo } from "react";
import { getCosmetic } from "@/game/data/cosmetics";
import { resolveAsset } from "@/game/data/asset-registry";
import type { CharacterAppearance, CharacterRenderMode, EquippedCharacterCosmetics } from "@/game/types";

function CharacterRendererComponent({ appearance, cosmetics, mode = "FULL_BODY", pose = "IDLE" }: { appearance: CharacterAppearance; cosmetics: EquippedCharacterCosmetics; mode?: CharacterRenderMode; pose?: "IDLE" | "WALK" | "WORK" | "INTERACT" | "CELEBRATE" }) {
  const tokens = (["OUTFIT", "HEADWEAR", "ACCESSORY"] as const).map((slot) => cosmetics[slot] ? resolveAsset(getCosmetic(cosmetics[slot]!)?.assetReference ?? "").token : "none");
  return <div className={`character-renderer mode-${mode.toLowerCase()} body-${appearance.bodyPreset.toLowerCase()} skin-${appearance.skinTone.toLowerCase()} face-${appearance.facePreset.toLowerCase()} hair-${appearance.hairStyle.toLowerCase()} haircolor-${appearance.hairColor.toLowerCase()} ${tokens.join(" ")} pose-${pose.toLowerCase()}`} aria-label="Founder Character">
    <span className="character-shadow" /><span className="character-legs"><i /><i /></span><span className="character-torso"><i className="character-shirt" /><i className="character-arm left" /><i className="character-arm right" /></span><span className="character-head"><i className="character-ear" /><i className="character-face"><b /><b /><em /></i><i className="character-hair" /><i className="character-cap" /><i className="character-glasses" /></span>
  </div>;
}

export const CharacterRenderer = memo(CharacterRendererComponent);
