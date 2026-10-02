"use client";
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Vector3, type OrthographicCamera as Camera } from "three";
import { Building2 } from "lucide-react";
import type { OrbitControls as Controls } from "three-stdlib";
import { CAMPUS_PLOTS } from "@/game/data/campus";
import { getBuildingState } from "@/game/data/buildings";
import { getBuildingUpgradeCheck } from "@/game/logic/buildings";
import { BuildingArt, CampusGround, MapFounder } from "@/components/campus-art";
import type { BuildingType, GameState } from "@/game/types";

export const CAMPUS_NAMES: Record<BuildingType, string> = { WORKSHOP: "Werkstatt", TOOL_WAREHOUSE: "Werkzeuglager", PERSONNEL: "Personal", BUSINESS_OFFICE: "Kundenbüro", RESEARCH: "Forschung", FINANCE: "Finanzen" };
function CameraRig({ resetKey, zoomStep, focus, mobile }: { resetKey: number; zoomStep: number; focus: BuildingType | null; mobile: boolean }) {
  const { size, invalidate } = useThree();
  const camera = useRef<Camera>(null), controls = useRef<Controls>(null), previousZoom = useRef(zoomStep);
  useEffect(() => { const c = camera.current; if (!c) return; c.position.set(23, 26, 30); c.zoom = Math.min(size.width / 38, size.height / 27); c.lookAt(0, 0, 0); c.updateProjectionMatrix(); controls.current?.target.set(0, 0, 0); controls.current?.update(); invalidate(); }, [size.width, size.height, resetKey, invalidate]);
  useEffect(() => { const c = camera.current; if (!c) return; const fit = Math.min(size.width / 38, size.height / 27); c.zoom = Math.max(fit * .65, Math.min(fit * 3, c.zoom * Math.pow(1.2, zoomStep - previousZoom.current))); previousZoom.current = zoomStep; c.updateProjectionMatrix(); invalidate(); }, [zoomStep, size.width, size.height, invalidate]);
  useEffect(() => { const c = camera.current, ctl = controls.current, plot = CAMPUS_PLOTS.find(p => p.buildingId === focus); if (!c || !ctl || !plot) return; const target = new Vector3((plot.x + plot.width / 2 - 800) / 60, mobile ? -1.5 : 0, (plot.y + plot.depth / 2 - 460) / 60); c.position.add(target.clone().sub(ctl.target)); ctl.target.copy(target); if (mobile) { c.zoom = Math.min(size.width / 38, size.height / 27) * 2; c.updateProjectionMatrix(); } ctl.update(); invalidate(); }, [focus, resetKey, mobile, size.width, size.height, invalidate]);
  return <><OrthographicCamera ref={camera} makeDefault position={[23, 26, 30]} near={.1} far={150} zoom={22}/><OrbitControls ref={controls} enablePan minZoom={Math.min(size.width / 38, size.height / 27) * .65} maxZoom={Math.min(size.width / 38, size.height / 27) * 3} minPolarAngle={.3} maxPolarAngle={1.25}/></>;
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="campus-unavailable">3D-Ansicht nicht verfügbar. Die Gebäudenavigation bleibt erreichbar.</div> : this.props.children; }
}
type LabelRefs = Partial<Record<BuildingType, HTMLDivElement>>;
function ProjectLabels({ state, labels }: { state: GameState; labels: RefObject<LabelRefs> }) {
  const point = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    for (const plot of CAMPUS_PLOTS) {
      const element = labels.current[plot.buildingId]; if (!element) continue;
      const tier = getBuildingState(state, plot.buildingId).visualTier;
      const height = plot.buildingId === "FINANCE" ? 3.1 + tier * .16 : 2.25 + tier * .25;
      point.current.set((plot.x + plot.width / 2 - 800) / 60, height, (plot.y + plot.depth / 2 - 460) / 60).project(camera);
      element.style.setProperty("transform", `translate(${(point.current.x + 1) * size.width / 2}px, ${(1 - point.current.y) * size.height / 2}px)`);
      element.style.setProperty("visibility", Math.abs(point.current.x) > 1 || Math.abs(point.current.y) > 1 ? "hidden" : "visible");
    }
  });
  return null;
}
export function CampusScene3D({ state, selected, onSelect, onClear, onOpenProfile, resetKey, zoomStep, focus, mobile }: { state: GameState; selected: BuildingType | null; onSelect: (id: BuildingType) => void; onClear: () => void; onOpenProfile: () => void; resetKey: number; zoomStep: number; focus: BuildingType | null; mobile: boolean }) {
  const labels = useRef<LabelRefs>({}), [hovered, setHovered] = useState<BuildingType | null>(null);
  return <div className="campus-render"><SceneBoundary><Canvas aria-label="Interaktive 3D-Firmenkarte" shadows dpr={[1, mobile ? 1 : 1.4]} frameloop="demand" gl={{ antialias: true, preserveDrawingBuffer: true }} onPointerMissed={event => { if (event.type === "click") onClear(); }}>
    <color attach="background" args={["#172126"]}/><CameraRig resetKey={resetKey} zoomStep={zoomStep} focus={focus} mobile={mobile}/>
    <ambientLight intensity={.85}/><hemisphereLight args={["#c5dbe0", "#55534b", 1.3]}/><directionalLight position={[-10, 25, 12]} intensity={2.6} castShadow shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-normalBias={.04}/>
    <CampusGround mobile={mobile}/>
    {CAMPUS_PLOTS.map(plot => <group key={plot.buildingId} name={`building-${plot.buildingId}`} position={[(plot.x + plot.width / 2 - 800) / 60, .12, (plot.y + plot.depth / 2 - 460) / 60]} onClick={event => { event.stopPropagation(); if (event.delta < 5) onSelect(plot.buildingId); }} onPointerOver={event => { event.stopPropagation(); setHovered(plot.buildingId); }} onPointerOut={() => setHovered(null)}><BuildingArt id={plot.buildingId} w={plot.width / 60} d={plot.depth / 60} tier={getBuildingState(state, plot.buildingId).visualTier} selected={selected === plot.buildingId} hovered={hovered === plot.buildingId}/></group>)}
    {state.playerCharacter && <MapFounder character={state.playerCharacter} onOpen={onOpenProfile}/>}
    <ProjectLabels state={state} labels={labels}/>
  </Canvas></SceneBoundary><div className="campus-labels">{CAMPUS_PLOTS.map(plot => { const building = getBuildingState(state, plot.buildingId), upgrade = getBuildingUpgradeCheck(state, plot.buildingId); return <div key={plot.buildingId} ref={element => { if (element) labels.current[plot.buildingId] = element; else delete labels.current[plot.buildingId]; }}><button className={`campus-label ${selected === plot.buildingId ? "selected" : ""} ${hovered === plot.buildingId ? "hovered" : ""}`} title={CAMPUS_NAMES[plot.buildingId]} aria-label={`${CAMPUS_NAMES[plot.buildingId]} auswählen`} aria-pressed={selected === plot.buildingId} onMouseEnter={() => setHovered(plot.buildingId)} onMouseLeave={() => setHovered(null)} onClick={() => onSelect(plot.buildingId)}><Building2 size={13}/><span>{CAMPUS_NAMES[plot.buildingId]}</span><small>Lv. {building.level} · {building.unlocked ? "In Betrieb" : "Gesperrt"}<br/>{upgrade.available ? "Ausbau möglich" : upgrade.reason}</small></button></div>; })}</div></div>;
}
