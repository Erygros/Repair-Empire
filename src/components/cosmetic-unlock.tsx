import { Sparkles } from "lucide-react";
import { CharacterRenderer } from "@/components/character-renderer";
import { getCosmetic } from "@/game/data/cosmetics";
import type { PlayerCharacter } from "@/game/types";

export function CosmeticUnlock({ cosmeticId, character, onClose }: { cosmeticId: string; character: PlayerCharacter; onClose: () => void }) {
  const cosmetic = getCosmetic(cosmeticId); if (!cosmetic) return null;
  const cosmetics = cosmetic.equipSlot ? { ...character.equippedCosmetics, [cosmetic.equipSlot]: cosmeticId } : character.equippedCosmetics;
  return <div className="character-setup-backdrop"><section className="cosmetic-unlock" role="dialog" aria-modal="true"><Sparkles size={28} /><p className="panel-label">NEW COSMETIC UNLOCKED</p><CharacterRenderer appearance={character.appearance} cosmetics={cosmetics} mode="PORTRAIT" /><h3>{cosmetic.name}</h3><span>{cosmetic.rarity} · {cosmetic.sourceType}</span><button onClick={onClose}>Zum Inventar hinzugefügt</button></section></div>;
}
