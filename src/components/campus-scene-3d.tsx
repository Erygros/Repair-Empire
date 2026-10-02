"use client";
import { Component, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Vector3, type Group, type OrthographicCamera as Camera } from "three";
import { Building2 } from "lucide-react";
import type { OrbitControls as Controls } from "three-stdlib";
import { CAMPUS_PLOTS, type CampusPlot } from "@/game/data/campus";
import { getBuildingState } from "@/game/data/buildings";
import type { BuildingType, GameState } from "@/game/types";

type Point = [number, number, number];
const COLORS: Record<BuildingType, string> = { WORKSHOP: "#eb8540", TOOL_WAREHOUSE: "#55878b", PERSONNEL: "#839b68", BUSINESS_OFFICE: "#708caa", RESEARCH: "#5ab8ad", FINANCE: "#b29b69" };
const NAMES: Record<BuildingType, string> = { WORKSHOP: "Werkstatt", TOOL_WAREHOUSE: "Werkzeuge", PERSONNEL: "Team", BUSINESS_OFFICE: "Kunden", RESEARCH: "Forschung", FINANCE: "Finanzen" };
function Box({ position, size, color, rotation = [0, 0, 0] }: { position: Point; size: Point; color: string; rotation?: Point }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.82}/></mesh>;
}
function Building({ plot, state, selected, onSelect }: { plot: CampusPlot; state: GameState; selected: boolean; onSelect: (id: BuildingType) => void }) {
  const building = getBuildingState(state, plot.buildingId);
  const w = plot.width / 60, d = plot.depth / 60, h = 1.25 + building.visualTier * .28;
  const x = (plot.x + plot.width / 2 - 800) / 60, z = (plot.y + plot.depth / 2 - 460) / 60;
  const accent = COLORS[plot.buildingId];
  return <group name={`building-${plot.buildingId}`} position={[x, .12, z]} onClick={event => { event.stopPropagation(); onSelect(plot.buildingId); }}>
    <Box position={[0, .02, 0]} size={[w + .6, .12, d + .6]} color={selected ? "#ffd08a" : "#c5cbc7"}/>
    <Box position={[0, h / 2, 0]} size={[w, h, d]} color="#e2e5d9"/>
    <Box position={[0, h * .45, d / 2 + .035]} size={[w, .3, .08]} color={accent}/>
    <Box position={[0, .13, d / 2 + .08]} size={[w, .25, .14]} color="#536264"/>
    {[-1, 1].map(side => <Box key={side} position={[side * w / 4, h + .15, 0]} size={[w / 2 + .25, .13, d + .35]} rotation={[0, 0, side * -.18]} color="#465c64"/>)}
    <Box position={[0, h + .37, 0]} size={[.14, .12, d + .4]} color="#61777c"/>
    {Array.from({ length: plot.buildingId === "WORKSHOP" ? 3 : 2 }, (_, i) => <group key={i} position={[(i - (plot.buildingId === "WORKSHOP" ? 1 : .5)) * w / 3.3, 0, 0]}>
      <Box position={[0, h * .65, d / 2 + .055]} size={[w / 4.8, h * .35, .08]} color="#345963"/>
      <Box position={[0, h * .65, d / 2 + .105]} size={[.035, h * .35, .025]} color="#cad7cf"/>
    </group>)}
    <Box position={[w * .34, .47, d / 2 + .085]} size={[.43, .85, .1]} color={accent}/>
    <Box position={[w * .34, .47, d / 2 + .15]} size={[.29, .45, .03]} color="#28484e"/>
    <Box position={[0, h + .35, -d * .2]} size={[w * .38, .16, d * .32]} color="#263c51"/>
    {building.visualTier > 1 && <Box position={[-w * .28, h + .32, -d * .2]} size={[.65, .4, .7]} color="#a2b3af"/>}
  </group>;
}
function Tree({ x, z }: { x: number; z: number }) {
  return <group position={[x, .12, z]}><mesh position={[0, .45, 0]} castShadow><cylinderGeometry args={[.08, .12, .9, 8]}/><meshStandardMaterial color="#75624b"/></mesh><mesh position={[0, 1.2, 0]} castShadow><coneGeometry args={[.65, 1.65, 8]}/><meshStandardMaterial color="#5d8960"/></mesh><mesh position={[0, 1.75, 0]} castShadow><coneGeometry args={[.48, 1.25, 8]}/><meshStandardMaterial color="#7aa371"/></mesh></group>;
}
function Van({ reduced }: { reduced: boolean }) {
  const van = useRef<Group>(null);
  useFrame(({ clock }) => { if (van.current) van.current.position.x = reduced ? 2 : Math.sin(clock.elapsedTime * .12) * 5; });
  return <group ref={van} name="delivery-van" position={[2, .2, 7.6]}>
    <Box position={[0, .5, 0]} size={[1.7, .8, .85]} color="#f5f3e6"/><Box position={[.58, .91, 0]} size={[.48, .2, .78]} color="#33626f"/><Box position={[0, .58, .435]} size={[.7, .22, .025]} color="#ef8541"/>
    {[-1, 1].flatMap(side => [-.55, .55].map(x => <mesh key={`${side}-${x}`} position={[x, .2, side * .45]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, .1, 16]}/><meshStandardMaterial color="#273538"/></mesh>))}
  </group>;
}
function CameraRig({ resetKey, zoomStep }: { resetKey: number; zoomStep: number }) {
  const { size, invalidate } = useThree();
  const camera = useRef<Camera>(null);
  const controls = useRef<Controls>(null);
  const previousZoom = useRef(zoomStep);
  useEffect(() => { const c = camera.current; if (!c) return; c.position.set(23, 26, 30); c.zoom = Math.min(size.width / 38, size.height / 27); c.lookAt(0, 0, 0); c.updateProjectionMatrix(); controls.current?.target.set(0, 0, 0); controls.current?.update(); invalidate(); }, [size.width, size.height, resetKey, invalidate]);
  useEffect(() => { const c = camera.current; if (!c) return; const fit = Math.min(size.width / 38, size.height / 27); c.zoom = Math.max(fit * .65, Math.min(fit * 3, c.zoom * Math.pow(1.2, zoomStep - previousZoom.current))); previousZoom.current = zoomStep; c.updateProjectionMatrix(); invalidate(); }, [zoomStep, size.width, size.height, invalidate]);
  return <><OrthographicCamera ref={camera} makeDefault position={[23, 26, 30]} near={.1} far={150} zoom={22}/><OrbitControls ref={controls} enablePan={false} minZoom={Math.min(size.width / 38, size.height / 27) * .65} maxZoom={Math.min(size.width / 38, size.height / 27) * 3} minPolarAngle={.3} maxPolarAngle={1.25}/></>;
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
      const element = labels.current[plot.buildingId];
      if (!element) continue;
      point.current.set((plot.x + plot.width / 2 - 800) / 60, 2.22 + getBuildingState(state, plot.buildingId).visualTier * .28, (plot.y + plot.depth / 2 - 460) / 60).project(camera);
      element.style.setProperty("transform", `translate(${(point.current.x + 1) * size.width / 2}px, ${(1 - point.current.y) * size.height / 2}px)`);
      element.style.setProperty("visibility", Math.abs(point.current.x) > 1 || Math.abs(point.current.y) > 1 ? "hidden" : "visible");
    }
  });
  return null;
}
export function CampusScene3D({ state, selected, onSelect, resetKey, zoomStep, reduced }: { state: GameState; selected: BuildingType; onSelect: (id: BuildingType) => void; resetKey: number; zoomStep: number; reduced: boolean }) {
  const labels = useRef<LabelRefs>({});
  return <div className="campus-render"><SceneBoundary><Canvas aria-label="Interaktive 3D-Firmenkarte" shadows dpr={[1, 1.4]} frameloop={reduced ? "demand" : "always"} gl={{ antialias: true, preserveDrawingBuffer: true }}>
    <color attach="background" args={["#adc6ca"]}/><CameraRig resetKey={resetKey} zoomStep={zoomStep}/>
    <ambientLight intensity={1.4}/><hemisphereLight args={["#e5f4ff", "#73856d", 1.3]}/><directionalLight position={[-10, 25, 12]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-normalBias={.04}/>
    <Box position={[0, -.2, 0]} size={[29, .5, 18]} color="#7e9d78"/><Box position={[0, .065, 0]} size={[26.7, .05, 15.3]} color="#afb9ad"/>
    <Box position={[0, .1, 7.6]} size={[29, .035, 1.5]} color="#56696d"/><Box position={[0, .105, 2]} size={[26.4, .04, 1.3]} color="#8b9693"/><Box position={[3, .105, 0]} size={[1.1, .04, 14.5]} color="#8b9693"/>
    {Array.from({ length: 15 }, (_, i) => <Box key={i} position={[-13 + i * 1.8, .13, 7.6]} size={[.85, .025, .06]} color="#e5e9df"/>)}
    {Array.from({ length: 6 }, (_, i) => <Box key={i} position={[-10.5 + i * 1.3, .13, 4.5]} size={[.035, .025, 1.8]} color="#edf0e4"/>)}
    {CAMPUS_PLOTS.map(plot => <Building key={plot.buildingId} plot={plot} state={state} selected={selected === plot.buildingId} onSelect={onSelect}/>)}
    {[-13, -10, -7, -4, 0, 4, 8, 12].map(x => <Tree key={x} x={x} z={-8}/>)}<Tree x={-13} z={4}/><Tree x={13} z={4}/><Tree x={-13} z={-2}/>
    <Box position={[11.6, .13, 5.3]} size={[2.5, .07, 1.9]} color="#849a7e"/>
    <Van reduced={reduced}/><ProjectLabels state={state} labels={labels}/>
  </Canvas></SceneBoundary><div className="campus-labels">{CAMPUS_PLOTS.map(plot => <div key={plot.buildingId} ref={element => { if (element) labels.current[plot.buildingId] = element; else delete labels.current[plot.buildingId]; }}><button className={`campus-label ${selected === plot.buildingId ? "selected" : ""}`} title={NAMES[plot.buildingId]} aria-label={`${NAMES[plot.buildingId]} auswählen`} aria-pressed={selected === plot.buildingId} onClick={() => onSelect(plot.buildingId)}><Building2 size={15}/><span>{NAMES[plot.buildingId]}</span><small>Lv. {getBuildingState(state, plot.buildingId).level}</small></button></div>)}</div></div>;
}
