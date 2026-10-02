"use client";
import { memo, useEffect, useState } from "react";
import { Focus, Minus, Plus } from "lucide-react";
import { WorkingIcon, ActiveIcon, ReadyIcon, DiagnosticsIcon, DiagnosticsActiveIcon } from "@/components/repair-icons";
import { ActiveIcon as Check, WorkshopNavIcon as Wrench } from "@/components/repair-icons";
import { WorkshopFloor3D } from "@/components/workshop-floor-3d";
import { getWorkshopStep, getWorkshopIdleSpeech, WORKSHOP_STEPS } from "@/components/workshop-animation";
import { getRepairProgress } from "@/game/logic/game";
import { getCurrentTime } from "@/game/logic/time";
import type { GameState } from "@/game/types";
import "./workshop-industrial.css";

function WorkshopSceneComponent({ state, now, selectedId, onSelect, motion = "AUTO" }: { state: GameState; now: number; selectedId: string; onSelect: (id: string) => void; motion?: "AUTO" | "FULL" | "REDUCED" }) {
  const [mobile,setMobile]=useState(false),[systemReduced,setSystemReduced]=useState(false),[reset,setReset]=useState(0),[zoom,setZoom]=useState(0),[speech,setSpeech]=useState<string|null>(null);
  useEffect(()=>{const phone=matchMedia("(max-width:620px)"),reduce=matchMedia("(prefers-reduced-motion:reduce)");const update=()=>{setMobile(phone.matches);setSystemReduced(reduce.matches)};update();phone.addEventListener("change",update);reduce.addEventListener("change",update);return()=>{phone.removeEventListener("change",update);reduce.removeEventListener("change",update)}},[]);
  const stations=state.workstations.filter(s=>s.status!=="locked"),selected=stations.find(s=>s.id===selectedId)??stations[0];
  const working=stations.filter(s=>s.activeRepair&&getRepairProgress(s.activeRepair,now)<100).length,pending=stations.some(s=>s.activeRepair&&getRepairProgress(s.activeRepair,now)>=100);
  useEffect(()=>{if(working)return;const started=getCurrentTime();const timer=setInterval(()=>setSpeech(getWorkshopIdleSpeech((getCurrentTime()-started)/1000,pending)),1000);return()=>clearInterval(timer)},[working,pending]);
  const progress=getRepairProgress(selected?.activeRepair??null,now),step=selected?.activeRepair?getWorkshopStep(progress):null;
  return <section className="workshop-scene workshop-scene-industrial" aria-label="Visuelle Werkstatt">
    <header><div><p className="panel-label">REPAIR EMPIRE / {working} AKTIV</p><h3>Produktionshalle</h3></div><span className="hall-status">{working ? <WorkingIcon/> : pending ? <ActiveIcon/> : <ReadyIcon/>}{working ? "In Arbeit" : pending ? "Abnahme bereit" : "Bereit"}</span></header>
    <div className="hall-station-tabs" role="group" aria-label="Arbeitsplätze">{stations.map(s=><button key={s.id} aria-pressed={s.id===selectedId} onClick={()=>onSelect(s.id)}><Wrench size={14}/><span>WS-{String(s.index).padStart(2,"0")}</span><small>{s.status==="completed"?"Fertig":s.activeRepair?"In Arbeit":"Bereit"}</small></button>)}</div>
    <div className="hall-stage"><WorkshopFloor3D state={state} now={now} selectedId={selectedId} onSelect={onSelect} reduced={motion==="REDUCED"||(motion==="AUTO"&&systemReduced)} mobile={mobile} reset={reset} zoom={zoom} speech={working ? null : speech}/><div className="hall-camera" role="group" aria-label="Werkstattkamera"><button title="Vergrößern" aria-label="Werkstatt vergrößern" onClick={()=>setZoom(v=>Math.min(2,v+1))}><Plus size={17}/></button><button title="Verkleinern" aria-label="Werkstatt verkleinern" onClick={()=>setZoom(v=>Math.max(-1,v-1))}><Minus size={17}/></button><button title="Ansicht zurücksetzen" aria-label="Werkstatt zentrieren" onClick={()=>{setZoom(0);setReset(v=>v+1)}}><Focus size={17}/></button></div></div>
    <footer className="hall-progress"><div className="hall-job"><span>{selected?.activeRepair?.order.device??"Kein Auftrag"}</span><strong>{selected?.activeRepair ? `${Math.floor(progress)} %` : "Wartet auf Arbeit"}</strong></div><ol aria-label="Reparaturfortschritt">{WORKSHOP_STEPS.map((label,i)=><li key={label} className={step===i?"current":progress>=(i+1)*25?"done":""} aria-current={step===i?"step":undefined}><span>{i===0 ? step===0 ? <DiagnosticsActiveIcon size="sm"/> : <DiagnosticsIcon size="sm"/> : progress>=(i+1)*25?<Check size={13}/>:String(i+1).padStart(2,"0")}</span><div><strong>{label}</strong><small>{(i+1)*25} %</small></div></li>)}</ol></footer>
  </section>;
}
export const WorkshopScene = memo(WorkshopSceneComponent);
