"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Character3D } from "@/components/character-3d";
import { DEFAULT_FOUNDER, FounderEditor, FounderEditorTools } from "@/components/founder-editor";
import { FOUNDER_SKILLS, type FounderSkill } from "@/game/data/founder-skills";
import { createInitialState } from "@/game/logic/game";
import { updateFounderModel } from "@/game/logic/founder-model";

export function CharacterCreator3D({initialName}:{initialName:string}) {
  const router=useRouter();
  const [a,setA]=useState(DEFAULT_FOUNDER),[name,setName]=useState(initialName),[skill,setSkill]=useState<FounderSkill|null>(null),[resetKey,setResetKey]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function finish() {
    if(name.trim().length<2||!skill||busy)return;setBusy(true);setError("");
    try {
      const response=await fetch("/api/character",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ceoName:name.trim(),appearance:a,founderSkill:skill})});
      if(!response.ok){setError(response.status===503?"Datenbank ist noch nicht konfiguriert.":"Character konnte nicht gespeichert werden.");setBusy(false);return;}
      const saved=await response.json(),state=createInitialState();
      state.playerCharacter=updateFounderModel({characterId:saved.id,displayName:name.trim(),appearance:{bodyPreset:"BALANCED",skinTone:"WARM",facePreset:"FOCUSED",hairStyle:"SHORT",hairColor:"BROWN"},equippedCosmetics:{OUTFIT:null,HEADWEAR:null,ACCESSORY:null},createdAt:Date.now(),founderSkill:skill},name,a);
      localStorage.setItem("repair-empire-save-v1",JSON.stringify(state));router.replace("/play");router.refresh();
    }catch{setError("Character konnte nicht gespeichert werden. Bitte versuche es erneut.");setBusy(false);}
  }
  return <main className="creator3d"><section><div className="creator-controls"><p className="panel-label">FOUNDER STUDIO</p><h1>Identität formen</h1></div><FounderEditor appearance={a} name={name} onChange={setA} onName={setName}/></section><section className="creator-stage"><Character3D appearance={a} resetKey={resetKey}/><FounderEditorTools onChange={setA} onResetView={()=>setResetKey(v=>v+1)}/></section><aside className="skill-select"><p className="panel-label">PERMANENTE AUSRICHTUNG</p><h2>Founder Skill</h2>{Object.entries(FOUNDER_SKILLS).map(([id,item])=><button key={id} className={skill===id?"active":""} onClick={()=>setSkill(id as FounderSkill)}><strong>{item.name}</strong><span>{item.bonus}</span><p>{item.description}</p></button>)}<p>Diese Entscheidung ist nach Erstellung dauerhaft.</p>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="create3d" disabled={!skill||name.trim().length<2||busy} onClick={finish}>{busy?"Speichert…":"Character erstellen"}</button></aside></main>;
}
