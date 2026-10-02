"use client";
import { memo, useEffect, useRef, useState } from "react";
import { ArrowRight, Focus, LocateFixed, Minus, Plus, X } from "lucide-react";
import { FounderIcon as UserRound } from "@/components/repair-icons";
import { CampusScene3D, CAMPUS_NAMES } from "@/components/campus-scene-3d";
import { getBuildingLevelDefinition, getBuildingState } from "@/game/data/buildings";
import { getBuildingUpgradeCheck } from "@/game/logic/buildings";
import type { BuildingType, GameState } from "@/game/types";
import "./campus-art.css";

function CompanyMapComponent({ state, onOpenBuilding, onOpenProfile, motion = "AUTO" }: { state: GameState; onOpenBuilding: (id: BuildingType) => void; onOpenProfile: () => void; motion?: "AUTO" | "FULL" | "REDUCED" }) {
  const [selected, setSelected] = useState<BuildingType | null>(null), [focus, setFocus] = useState<BuildingType | null>(null);
  const [resetKey, setResetKey] = useState(0), [zoomStep, setZoomStep] = useState(0), [mobile, setMobile] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const stage = useRef<HTMLDivElement>(null), title = useRef<HTMLElement>(null);
  useEffect(() => {
    const heading = title.current, container = stage.current; if (!heading || !container) return;
    const update = () => container.style.setProperty("--campus-title-height", `${heading.offsetHeight}px`);
    const observer = new ResizeObserver(update); observer.observe(heading); update();
    return () => observer.disconnect();
  }, []);
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setSystemReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { const media = matchMedia("(max-width: 620px)"); const update = () => setMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  const building = selected ? getBuildingState(state, selected) : null;
  const level = selected && building ? getBuildingLevelDefinition(selected, building.level) : null;
  const upgrade = selected ? getBuildingUpgradeCheck(state, selected) : null;
  const busy = state.workstations.filter(item => item.status === "repairing").length;
  return <section className={`campus-home campus-industrial ${selected ? "has-selection" : ""}`} aria-label="Firmenübersicht">
    <div className="campus-stage" ref={stage}>
      <CampusScene3D state={state} selected={selected} onSelect={id => { setSelected(id); if (mobile) { setFocus(id); setResetKey(value => value + 1); } }} onClear={() => setSelected(null)} onOpenProfile={onOpenProfile} resetKey={resetKey} zoomStep={zoomStep} focus={focus} mobile={mobile} reduced={motion === "REDUCED" || (motion === "AUTO" && systemReduced)}/>
      <header className="campus-title" ref={title}><span>REPAIR EMPIRE / CAMPUS</span><h2>{state.identity.companyName}</h2><p><i/>{state.buildings.filter(item => item.unlocked).length} Gebäude in Betrieb</p></header>
      <div className="campus-camera" role="group" aria-label="Kartensteuerung"><button title="Vergrößern" aria-label="Karte vergrößern" onClick={() => setZoomStep(value => value + 1)}><Plus size={18}/></button><button title="Verkleinern" aria-label="Karte verkleinern" onClick={() => setZoomStep(value => value - 1)}><Minus size={18}/></button><button title="Ansicht zurücksetzen" aria-label="Karte zentrieren" onClick={() => { setFocus(null); setResetKey(value => value + 1); }}><LocateFixed size={18}/></button>{selected && <button title="Gebäude fokussieren" aria-label="Gebäude fokussieren" onClick={() => { setFocus(selected); setResetKey(value => value + 1); }}><Focus size={18}/></button>}<button title="Founder-Profil" aria-label="Founder-Profil öffnen" disabled={!state.playerCharacter} onClick={onOpenProfile}><UserRound size={18}/></button></div>
    </div>
    {selected && building && level && <aside className="campus-context" aria-label="Gebäudeinformationen" aria-live="polite"><button className="campus-close" title="Auswahl schließen" aria-label="Auswahl schließen" onClick={() => setSelected(null)}><X size={17}/></button><span className="panel-label">GEBÄUDE / LEVEL {building.level}</span><h3>{CAMPUS_NAMES[selected]}</h3><p>{level.name} · {building.unlocked ? "In Betrieb" : "Gesperrt"}</p>{selected === "WORKSHOP" && <dl><div><dt>Reparaturen aktiv</dt><dd>{busy}</dd></div><div><dt>Mitarbeiter</dt><dd>{state.employees.length}</dd></div></dl>}<p className={upgrade?.available ? "upgrade-ready" : "campus-upgrade-status"}>{upgrade?.available ? "Ausbau möglich" : upgrade?.reason}</p><button className="campus-open" disabled={!building.unlocked} onClick={() => onOpenBuilding(selected)}>{selected === "WORKSHOP" ? "Werkstatt öffnen" : "Gebäude öffnen"}<ArrowRight size={17}/></button></aside>}
  </section>;
}
export const CompanyMap = memo(CompanyMapComponent);
