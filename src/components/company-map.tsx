"use client";
import { memo, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LocateFixed, Minus, Plus, UserRound, Wrench } from "lucide-react";
import { CampusScene3D } from "@/components/campus-scene-3d";
import { getBuildingDefinition, getBuildingLevelDefinition, getBuildingState } from "@/game/data/buildings";
import type { BuildingType, GameState } from "@/game/types";

function CompanyMapComponent({ state, onOpenBuilding, onOpenProfile, motion = "AUTO" }: { state: GameState; onOpenBuilding: (id: BuildingType) => void; onOpenProfile: () => void; motion?: "AUTO" | "FULL" | "REDUCED" }) {
  const [selected, setSelected] = useState<BuildingType>("WORKSHOP");
  const [resetKey, setResetKey] = useState(0), [zoomStep, setZoomStep] = useState(0), [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setSystemReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const building = getBuildingState(state, selected), definition = getBuildingDefinition(selected);
  const level = getBuildingLevelDefinition(selected, building.level)!;
  const completed = state.workstations.filter(item => item.status === "completed").length;
  const busy = state.workstations.filter(item => item.status === "repairing").length;
  const opened = state.buildings.filter(item => item.unlocked).length;
  return <section className="campus-home" aria-label="Firmenübersicht">
    <div className="campus-stage">
      <CampusScene3D state={state} selected={selected} onSelect={setSelected} resetKey={resetKey} zoomStep={zoomStep} reduced={motion === "REDUCED" || (motion === "AUTO" && systemReduced)}/>
      <header className="campus-title"><span>DEIN UNTERNEHMEN</span><h2>{state.identity.companyName}</h2><p><i/>{opened} Gebäude in Betrieb</p></header>
      <div className="campus-camera" role="group" aria-label="Kartensteuerung"><button title="Vergrößern" aria-label="Karte vergrößern" onClick={() => setZoomStep(value => value + 1)}><Plus size={18}/></button><button title="Verkleinern" aria-label="Karte verkleinern" onClick={() => setZoomStep(value => value - 1)}><Minus size={18}/></button><button title="Ansicht zurücksetzen" aria-label="Karte zentrieren" onClick={() => setResetKey(value => value + 1)}><LocateFixed size={18}/></button></div>
    </div>
    <aside className="campus-overview">
      <div className="campus-selection" aria-live="polite"><span className="panel-label">GEBÄUDE · LEVEL {building.level}</span><h3>{selected === "WORKSHOP" ? "Deine Werkstatt" : definition.name}</h3><p>{level.description}</p><ul>{level.unlocks.filter(item => !item.startsWith("Visual Tier")).map(item => <li key={item}><CheckCircle2 size={14}/>{item}</li>)}</ul><button className="campus-open" disabled={!building.unlocked} onClick={() => onOpenBuilding(selected)}>{selected === "WORKSHOP" ? "Werkstatt öffnen" : "Gebäude öffnen"}<ArrowRight size={18}/></button></div>
      <div className="campus-operations"><h4>Betrieb heute</h4><dl><div><dt>Aufträge verfügbar</dt><dd>{state.availableOrders.length}</dd></div><div><dt>Reparaturen aktiv</dt><dd>{busy}</dd></div><div><dt>Bereit zur Abnahme</dt><dd>{completed}</dd></div><div><dt>Mitarbeiter</dt><dd>{state.employees.length}</dd></div></dl>{completed > 0 && <button onClick={() => onOpenBuilding("WORKSHOP")}><Wrench size={15}/>{completed} Reparatur{completed > 1 ? "en" : ""} abnehmen<ArrowRight size={15}/></button>}</div>
      <button className="campus-founder" onClick={onOpenProfile} disabled={!state.playerCharacter}><UserRound size={19}/><span><strong>{state.playerCharacter?.displayName ?? "Founder"}</strong><small>Mein Charakter</small></span><ArrowRight size={16}/></button>
    </aside>
  </section>;
}
export const CompanyMap = memo(CompanyMapComponent);
