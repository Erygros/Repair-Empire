import type { Character3DAppearance } from "@/components/character-3d";
import type { PlayerCharacter } from "@/game/types";

export function updateFounderModel(character:PlayerCharacter,name:string,model:Character3DAppearance):PlayerCharacter {
  return { ...character, displayName:name.trim(), model3d:{...model}, appearance:{
    bodyPreset:model.height>66?"TALL":model.height<34?"COMPACT":"BALANCED",
    skinTone:model.skinTone==="PORCELAIN"?"LIGHT":model.skinTone==="DARK"?"DEEP":model.skinTone as "WARM"|"MEDIUM"|"DEEP",
    facePreset:model.eyeShape==="FOCUSED"?"FOCUSED":"CALM",
    hairStyle:model.hair==="LONG"?"TIED":model.hair==="CURLY"?"WAVES":model.hair==="BUZZ"?"CROP":"SHORT",
    hairColor:model.hairColor as PlayerCharacter["appearance"]["hairColor"],
  }, equippedCosmetics:{...character.equippedCosmetics, OUTFIT:model.outfit==="ORANGE"?"outfit-orange-jacket":model.outfit==="DARK"?"outfit-dark-technician":"outfit-basic-workwear"} };
}
