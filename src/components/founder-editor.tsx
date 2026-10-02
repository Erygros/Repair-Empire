"use client";
import { RotateCcw, Shuffle } from "lucide-react";
import type { Character3DAppearance } from "@/components/character-3d";
import "./founder-editor.css";

export const DEFAULT_FOUNDER: Character3DAppearance = { presentation:"FEMALE",height:50,build:50,shoulders:50,arms:50,chest:50,torso:50,waist:50,hips:50,legs:50,skinTone:"WARM",headShape:"OVAL",eyeShape:"CALM",eyeColor:"BROWN",eyebrows:"NORMAL",nose:"STRAIGHT",mouth:"NEUTRAL",hair:"MEDIUM",hairColor:"BROWN",outfit:"ORANGE" };
export const FOUNDER_SLIDERS = ["height","build","shoulders","arms","chest","torso","waist","hips","legs"] as const;
export const FOUNDER_OPTIONS = {skinTone:["PORCELAIN","WARM","MEDIUM","DEEP","DARK"],headShape:["NARROW","OVAL","ROUND","ANGULAR","WIDE"],eyeShape:["CALM","ROUND","FOCUSED"],eyeColor:["BROWN","DARK_BROWN","BLUE","GREEN","GREY","HAZEL"],eyebrows:["FINE","NORMAL","STRAIGHT","CURVED","BOLD"],nose:["STRAIGHT","NARROW","WIDE"],mouth:["NEUTRAL","SOFT","FIRM"],hair:["BUZZ","SHORT","SIDE","MEDIUM","LONG","SLICK","CURLY"],hairColor:["BLACK","BROWN","COPPER","BLONDE","SILVER"],outfit:["BASIC","DARK","ORANGE"]} as const;
const LABELS: Record<string,string> = {height:"Größe",build:"Statur",shoulders:"Schultern",arms:"Arme",chest:"Brust",torso:"Oberkörper",waist:"Taille",hips:"Hüfte",legs:"Beine",skinTone:"Haut",headShape:"Kopf",eyeShape:"Augen",eyeColor:"Augenfarbe",eyebrows:"Brauen",nose:"Nase",mouth:"Mund",hair:"Haare",hairColor:"Haarfarbe",outfit:"Outfit"};

export function FounderEditor({ appearance, name, onChange, onName }: { appearance:Character3DAppearance; name:string; onChange:(a:Character3DAppearance)=>void; onName:(name:string)=>void }) {
  const set = (key:keyof Character3DAppearance,value:string|number) => onChange({...appearance,[key]:value});
  return <div className="founder-editor creator-controls">
    <label>CEO Name<input value={name} maxLength={24} onChange={e=>onName(e.target.value)}/></label>
    <div className="segment" role="group" aria-label="Präsentation">{(["MALE","FEMALE"] as const).map(p=><button type="button" key={p} aria-pressed={appearance.presentation===p} className={appearance.presentation===p?"active":""} onClick={()=>set("presentation",p)}>{p==="MALE"?"Männlich":"Weiblich"}</button>)}</div>
    {FOUNDER_SLIDERS.map(key=><label key={key}>{LABELS[key]} <span>{appearance[key]}</span><input type="range" min="0" max="100" value={appearance[key]} onChange={e=>set(key,Number(e.target.value))}/></label>)}
    <div className="creator-options">{Object.entries(FOUNDER_OPTIONS).map(([key,values])=><label key={key}>{LABELS[key]}<select value={String(appearance[key as keyof Character3DAppearance])} onChange={e=>set(key as keyof Character3DAppearance,e.target.value)}>{values.map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
  </div>;
}

export function FounderEditorTools({ onChange, onResetView }: { onChange:(a:Character3DAppearance)=>void; onResetView:()=>void }) {
  return <div className="founder-editor-tools"><button type="button" title="Zufällig" aria-label="Zufällig" onClick={()=>onChange({...DEFAULT_FOUNDER,height:Math.floor(Math.random()*101),build:Math.floor(Math.random()*101),skinTone:FOUNDER_OPTIONS.skinTone[Math.floor(Math.random()*FOUNDER_OPTIONS.skinTone.length)]})}><Shuffle size={18}/></button><button type="button" title="Ansicht zurücksetzen" aria-label="Ansicht zurücksetzen" onClick={onResetView}><RotateCcw size={18}/></button><button type="button" onClick={()=>onChange({...DEFAULT_FOUNDER})}>Character zurücksetzen</button></div>;
}
