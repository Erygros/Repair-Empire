"use client";

import { useEffect, useRef, useState } from "react";
import { CircuitBoard, FlaskConical, ScanLine, Workflow, Check } from "lucide-react";
import { DeviceVisual } from "@/components/device-visual";
import { TechnicianVisual } from "@/components/technician-visual";
import { CampusBuilding } from "@/components/campus-building";
import { CAMPUS_PLOTS } from "@/game/data/campus";
import { createInitialState } from "@/game/logic/game";

const previewState = createInitialState();
const phases = ["DIAGNOSING", "REPAIRING", "TESTING", "COMPLETED"] as const;
const labels = ["Diagnose", "Reparatur", "Systemtest", "Abgeschlossen"];

export function WorkshopDemo({ compact = false, single = false }: { compact?: boolean; single?: boolean }) {
  const [step,setStep] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = false;
    const update = () => { if (timer) clearInterval(timer); timer=undefined; if (visible && !reduced.matches && !document.hidden) timer=setInterval(()=>setStep(value=>(value+1)%4),2400); };
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();});
    if(root.current) observer.observe(root.current);
    reduced.addEventListener("change",update); document.addEventListener("visibilitychange",update);
    return()=>{if(timer)clearInterval(timer);observer.disconnect();reduced.removeEventListener("change",update);document.removeEventListener("visibilitychange",update);};
  },[]);
  return <div ref={root} role="img" className={`website-workshop ${compact ? "compact" : ""}`} aria-label="Werkstatt-Vorschau mit Geräten und Technikern in Diagnose, Reparatur und Systemtest"><div className="demo-wall"><span>REPAIR EMPIRE</span><b>WORKSHOP / DEMO</b><i/><i/><i/></div><div className="demo-benches" aria-hidden="true">{Array.from({length:single?1:3},(_,index)=>{
    const phaseIndex=index===2?0:(step+index)%4;
    const phase=index===2?"IDLE":phases[phaseIndex];
    return <div className={`demo-bench demo-${phase.toLowerCase()}`} key={index}><div className="demo-lamp"/><div className="demo-monitor"><ScanLine size={15}/><span>{index===2?"Bereit":labels[phaseIndex]}</span></div><div className="demo-table">{index!==2&&<DeviceVisual device={index===0?"Smartphone":"Game Console"} phase={phase}/>}<span className="demo-tool"/></div><TechnicianVisual employee={null} phase={phase} founderName={index===2?"Freier Arbeitsplatz":index===0?"Reparatur":"Qualitätsprüfung"}/><div className="demo-phase"><span>WS / 0{index+1}</span><b>{index===2?"IDLE":phase=== "COMPLETED"?<><Check size={12}/> Fertig</>:labels[phaseIndex]}</b><i style={{"--demo-progress":`${phaseIndex===3?100:25+phaseIndex*25}%`} as React.CSSProperties}/></div></div>;
  })}</div><div className="demo-floor-mark"/></div>;
}

export function CampusScene({tier=3}:{tier?:number}) {
  const state={...previewState,buildings:previewState.buildings.map(building=>({...building,visualTier:building.buildingId==="WORKSHOP"?tier:2}))};
  return <div className={`website-campus campus-stage-${tier}`} role="img" aria-label={`Campus-Vorschau mit Workshop Visual Tier ${tier}`}><div className="preview-drive"/><div className="preview-parking"/><div className="preview-green"/><div className="preview-campus-world" inert>{CAMPUS_PLOTS.filter(plot=>tier===1?plot.buildingId==="WORKSHOP":["WORKSHOP","TOOL_WAREHOUSE","RESEARCH","BUSINESS_OFFICE"].includes(plot.buildingId)).map(plot=><CampusBuilding key={plot.buildingId} plot={plot} state={state} notification={null} selected={false} recentUpgrade={false} onSelect={()=>{}}/>)}</div><span className="preview-campus-sign">REPAIR EMPIRE</span></div>;
}

export function ResearchScene() {
  return <div className="website-research" role="img" aria-label="Forschung: Diagnose, Reparaturtechnik und Automation"><div className="research-wire"/>{[ScanLine,CircuitBoard,Workflow,FlaskConical].map((Icon,index)=><div className={`preview-node node-${index}`} key={index}><Icon size={30}/><span>{["Diagnostik","Reparaturtechnik","Automation","Forschung"][index]}</span><i/></div>)}<div className="research-unlock"><Check size={16}/> Prozess verbessert</div></div>;
}
