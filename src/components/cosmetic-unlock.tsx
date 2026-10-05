import { CosmeticUnlockIcon as Sparkles } from "@/components/repair-icons";
import { Character3D } from "@/components/character-3d";
import { resolveCharacterModel, cosmeticCompatible } from "@/game/data/character-models";
import { getCosmetic } from "@/game/data/cosmetics";
import type { PlayerCharacter } from "@/game/types";

export function CosmeticUnlock({ cosmeticId, character, onClose }: { cosmeticId: string; character: PlayerCharacter; onClose: () => void }) {
  const cosmetic = getCosmetic(cosmeticId); if (!cosmetic) return null;
  const modelId = resolveCharacterModel(character);
  return <div className="character-setup-backdrop"><section className="cosmetic-unlock" role="dialog" aria-modal="true"><Sparkles size={28} /><p className="panel-label">NEW COSMETIC UNLOCKED</p><div style={{height:240}}><Character3D modelId={modelId} quality="LOW" motion="REDUCED"/></div><h3>{cosmetic.name}</h3><span>{cosmetic.rarity} · {cosmetic.sourceType}</span>{cosmetic.equipSlot && !cosmeticCompatible(modelId,cosmeticId) && <p>Gesammelt · nicht für dieses Modell geeignet</p>}<button onClick={onClose}>Zum Inventar hinzugefügt</button></section></div>;
}
