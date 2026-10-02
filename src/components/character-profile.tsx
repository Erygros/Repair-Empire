"use client";
import { RepairEmpireIcon } from "@/components/repair-icons";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { WardrobeIcon as Shirt } from "@/components/repair-icons";
import { ActiveIcon as Check, LockedIcon as LockKeyhole } from "@/components/repair-icons";
import { Character3D, type Character3DAppearance } from "@/components/character-3d";
import { FounderEditor, FounderEditorTools } from "@/components/founder-editor";
import { getFounderAppearance } from "@/components/founder-appearance";
import { FOUNDER_SKILLS } from "@/game/data/founder-skills";
import { COSMETICS } from "@/game/data/cosmetics";
import type { CharacterCosmeticSlot, GameState } from "@/game/types";
import "./department-scenes.css";

export function CharacterProfile({state,onBack,onEquip,onUnequip,onSave,onDirtyChange,motion}:{state:GameState;onBack:()=>void;onEquip:(id:string)=>void;onUnequip:(slot:CharacterCosmeticSlot)=>void;onSave:(name:string,a:Character3DAppearance)=>void;onDirtyChange:(dirty:boolean)=>void;motion:"AUTO"|"FULL"|"REDUCED"}) {
  const character=state.playerCharacter!;
  const [a,setA]=useState(()=>getFounderAppearance(character)),[name,setName]=useState(character.displayName),[reset,setReset]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(""),[filter,setFilter]=useState<CharacterCosmeticSlot>("OUTFIT");
  const owned=new Set(state.cosmeticEntitlements.map(c=>c.cosmeticId));
  const dirty=JSON.stringify(a)!==JSON.stringify(getFounderAppearance(character))||name.trim()!==character.displayName;
  useEffect(()=>{onDirtyChange(dirty||busy);return()=>onDirtyChange(false);},[dirty,busy,onDirtyChange]);
  useEffect(()=>{if(!dirty)return;const prevent=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",prevent);return()=>window.removeEventListener("beforeunload",prevent);},[dirty]);
  async function save(){
    if(busy||name.trim().length<2)return;setBusy(true);setError("");
    try {
      const response=await fetch("/api/character",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({ceoName:name.trim(),appearance:a})});
      if(!response.ok)throw new Error(response.status===401?"Bitte erneut einloggen.":"Founder konnte nicht gespeichert werden. Bitte erneut versuchen.");
      onSave(name,a);
    }catch(e){setError(e instanceof Error?e.message:"Speichern fehlgeschlagen.");}finally{setBusy(false);}
  }
  return <section className="founder-studio"><header className="founder-studio-header"><button aria-label="Zur Firmenkarte" title="Zur Firmenkarte" onClick={onBack}><ArrowLeft size={18}/></button><div><p className="panel-label">FOUNDER STUDIO</p><h2>{character.displayName}</h2></div><button className="founder-save" disabled={!dirty||busy||name.trim().length<2} onClick={save}><Save size={16}/>{busy?"Speichert…":"Speichern"}</button></header>
    <div className="founder-studio-layout"><FounderEditor appearance={a} name={name} onChange={setA} onName={setName}/><section className="founder-studio-stage"><Character3D appearance={a} cosmetics={character.equippedCosmetics} resetKey={reset} motion={motion}/><FounderEditorTools onChange={setA} onResetView={()=>setReset(v=>v+1)}/></section><aside className="founder-wardrobe">
      {character.founderSkill&&<div className="founder-skill"><RepairEmpireIcon category="skills" name={character.founderSkill.toLowerCase()} size="lg"/><strong>{FOUNDER_SKILLS[character.founderSkill].name}</strong><p>{FOUNDER_SKILLS[character.founderSkill].bonus}</p><small>Founder Skill · dauerhaft</small></div>}
      {error&&<p role="alert" className="auth-error">{error}</p>}
      <h3><Shirt size={17}/> Garderobe</h3><nav aria-label="Cosmetic-Kategorie">{(["OUTFIT","HEADWEAR","ACCESSORY"] as const).map(slot=><button key={slot} aria-pressed={filter===slot} onClick={()=>setFilter(slot)}>{slot==="OUTFIT"?"Outfit":slot==="HEADWEAR"?"Kopfbedeckung":"Accessoires"}</button>)}</nav>
      {COSMETICS.filter(c=>c.equipSlot===filter).map(item=><article className="founder-cosmetic" key={item.cosmeticId}><strong>{item.name}</strong><button disabled={!owned.has(item.cosmeticId)||busy||dirty||character.equippedCosmetics[filter]===item.cosmeticId} onClick={()=>{onEquip(item.cosmeticId);if(filter==="OUTFIT")setA({...a,outfit:item.cosmeticId.includes("orange")?"ORANGE":item.cosmeticId.includes("dark")?"DARK":"BASIC"});}}>{character.equippedCosmetics[filter]===item.cosmeticId?<><Check size={14}/>Ausgerüstet</>:!owned.has(item.cosmeticId)?<><LockKeyhole size={14}/>Gesperrt</>:"Ausrüsten"}</button></article>)}
      {filter!=="OUTFIT"&&character.equippedCosmetics[filter]&&<button disabled={dirty||busy} onClick={()=>onUnequip(filter)}>Ablegen</button>}
    </aside></div>
  </section>;
}
