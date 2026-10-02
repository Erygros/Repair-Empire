"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { ActiveIcon as Check, TechnologyIcon as CircuitBoard, ResearchIcon as FlaskConical, AutomationIcon as Workflow } from "@/components/repair-icons";

const ART = {
  starter: "/images/website-starter.webp",
  expanded: "/images/website-expanded.webp",
  campus: "/images/website-campus.webp",
  workshop: "/images/website-workshop.webp",
  repair: "/images/website-repair.webp",
  research: "/images/website-research.webp",
} as const;
const PHASES = ["Diagnose", "Reparatur", "Systemtest", "Fertig"];

export function PresentationArt({ kind, alt = "", sizes = "(max-width: 900px) 100vw, 650px" }: { kind: keyof typeof ART; alt?: string; sizes?: string }) {
  return <Image src={ART[kind]} alt={alt} fill loading="lazy" sizes={sizes}/>;
}

export function WorkshopDemo({ compact = false, single = false }: { compact?: boolean; single?: boolean }) {
  const [step, setStep] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = false;
    const update = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      const running = visible && !reduced.matches && !document.hidden;
      root.current?.classList.toggle("scene-active", running);
      if (running) timer = setInterval(() => setStep(value => (value + 1) % 4), 2600);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => { if (timer) clearInterval(timer); observer.disconnect(); reduced.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  return <div ref={root} className={`marketing-workshop ${compact ? "is-compact" : ""} ${single ? "is-closeup" : ""}`}>
    <PresentationArt kind={single ? "repair" : "workshop"} sizes={compact ? "(max-width: 900px) 100vw, 650px" : "(max-width: 1400px) 90vw, 1240px"} alt={single ? "Technikerin repariert ein Smartphone unter Arbeitslicht" : "Drei verschiedene Techniker arbeiten an Smartphone, Konsole und Laptop"}/>
    <div className="marketing-art-shade"/><span className="scene-kicker"><i/> {single ? "PRECISION REPAIR" : "WORKSHOP FLOOR"}</span>
    <div className="station-light light-repair"/><div className="station-light light-test"/>
    <div className="repair-scan" aria-hidden="true"/>
    <div className="marketing-stations">{Array.from({ length: single ? 1 : 3 }, (_, index) => {
      const phase = index === 2 ? -1 : (step + index) % 4;
      return <div key={index} className={`marketing-station ${phase === 3 ? "is-complete" : ""}`}>
        <span>{["SMARTPHONE", "KONSOLE", "LAPTOP"][index]}</span>
        <strong>{phase === 3 ? <Check size={15}/> : index === 2 ? <Workflow size={15}/> : <ScanLine size={15}/>} {phase === -1 ? "Bereit" : PHASES[phase]}</strong>
        <div className="station-meter"><i style={{ transform: `scaleX(${phase < 0 ? .08 : (phase + 1) / 4})` }}/></div>
        {phase === 3 && <span key={`complete-${step}`} className="station-completion">Reparatur abgeschlossen</span>}
      </div>;
    })}</div>
  </div>;
}

export function CampusScene({ tier = 3 }: { tier?: number }) {
  const kind = tier === 1 ? "starter" : tier === 2 ? "expanded" : "campus";
  return <div className={`marketing-campus campus-${kind}`}><PresentationArt kind={kind} alt={kind === "starter" ? "Kleine Starterwerkstatt mit einer Werkbank" : kind === "expanded" ? "Ausgebaute Werkstatt mit mehreren Arbeitsplätzen" : "Repair-Campus mit Werkstatt, Lager und Forschung"}/><div className="marketing-art-shade"/><span className="campus-art-label"><i/> {kind === "starter" ? "STARTER WORKSHOP" : kind === "expanded" ? "WORKSHOP EXPANSION" : "COMPANY CAMPUS"}</span><div className="campus-ambient-light"/></div>;
}

export function CampusEvolution() {
  const [stage, setStage] = useState(2);
  const choices = [{ tier: 1, label: "Werkstatt" }, { tier: 2, label: "Ausbau" }, { tier: 5, label: "Campus" }];
  return <div className="campus-evolution"><CampusScene tier={choices[stage].tier}/><div className="evolution-choices" role="group" aria-label="Ausbaustufe ansehen">{choices.map((choice, index) => <button key={choice.tier} aria-pressed={stage === index} onClick={() => setStage(index)}><span>0{index + 1}</span>{choice.label}</button>)}</div></div>;
}

export function ResearchScene() {
  const [selected, setSelected] = useState(0);
  const nodes = [{ icon: ScanLine, label: "Diagnostik", detail: "Fehler präziser erkennen" }, { icon: CircuitBoard, label: "Reparaturtechnik", detail: "Werkzeuge weiterentwickeln" }, { icon: Workflow, label: "Automation", detail: "Abläufe verbessern" }];
  const node = nodes[selected];
  return <div className="marketing-research"><PresentationArt kind="research" alt="Forschungslabor mit Mikroskop, Messgeräten und verbundenen Technikmodulen"/><div className="marketing-art-shade"/><span className="scene-kicker"><FlaskConical size={13}/> RESEARCH LAB</span><div className="research-selection"><span>FORSCHUNGSBEREICH</span><strong>{node.label}</strong><p>{node.detail}</p></div><div className="research-options" role="group" aria-label="Forschungsbereich ansehen">{nodes.map(({ icon: Icon, label }, index) => <button key={label} onClick={() => setSelected(index)} aria-pressed={selected === index}><Icon size={18}/><span>{label}</span></button>)}</div></div>;
}
