"use client";
import { Component, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Vector3, type Group, type OrthographicCamera as Camera } from "three";
import { FounderAvatar, type Character3DAppearance } from "@/components/character-3d";
import { getFounderAppearance } from "@/components/founder-appearance";
import { ArtBox } from "@/components/campus-art";
import { getWorkshopStep, WORKSHOP_STEP_X } from "@/components/workshop-animation";
import { getRepairProgress } from "@/game/logic/game";
import type { DeviceKind, EquippedCharacterCosmetics, GameState, Workstation } from "@/game/types";

function HallCamera({ count, reset, zoom }: { count: number; reset: number; zoom: number }) {
  const { size, invalidate } = useThree(), camera = useRef<Camera>(null);
  const center = (count - 1) * 1.6;
  useEffect(() => { const c = camera.current; if (!c) return; c.position.set(12, 16, 19 + center); c.lookAt(0, .5, center); c.zoom = Math.min(size.width / 19, size.height / (12 + count * 2)) * Math.pow(1.2, zoom); c.updateProjectionMatrix(); invalidate(); }, [size.width, size.height, center, count, reset, zoom, invalidate]);
  return <><OrthographicCamera ref={camera} makeDefault near={.1} far={120} position={[12,16,19 + center]} zoom={30}/><OrbitControls key={reset} target={[0,.5,center]} enablePan enableZoom={false} minPolarAngle={.35} maxPolarAngle={1.15}/></>;
}
function ExhaustFan({ x, reduced }: { x: number; reduced: boolean }) {
  const rotor = useRef<Group>(null);
  useFrame((_, delta) => { if (rotor.current && !reduced) rotor.current.rotation.z += Math.min(delta,.05) * 1.8; });
  return <group position={[x,2.35,-2.63]}><ArtBox position={[0,0,0]} size={[1.05,1.05,.15]} color="#42535a"/><mesh rotation={[Math.PI / 2,0,0]}><cylinderGeometry args={[.43,.43,.12,24]}/><meshStandardMaterial color="#203138"/></mesh><group ref={rotor} position={[0,0,.1]}>{[0,1,2,3].map(i => <group key={i} rotation={[0,0,i*Math.PI/2]}><ArtBox position={[0,.19,0]} size={[.15,.38,.025]} color="#91a4a8" metal={.6}/></group>)}</group></group>;
}
function Hall({ count, reduced }: { count: number; reduced: boolean }) {
  const depth = 6 + (count - 1) * 3.2, center = (count - 1) * 1.6;
  return <group name="workshop-hall"><ArtBox position={[0,-.12,center]} size={[15,.24,depth]} color="#515e61"/><ArtBox position={[0,1.65,-2.8]} size={[15,3.3,.22]} color="#3a4b51"/><ArtBox position={[-7.4,1.2,center]} size={[.18,2.4,depth]} color="#33464c"/>
    {[-6,-3,0,3,6].map(x => <group key={x}><ArtBox position={[x,1.65,-2.62]} size={[.12,3.3,.12]} color="#73858a" metal={.6}/>{Math.abs(x)===6&&<ArtBox position={[x,3.3,center]} size={[.1,.18,depth]} color="#55676d"/>}</group>)}
    <ArtBox position={[0,.75,-2.61]} size={[14,.04,.07]} color="#ed944c" glow={.25}/><ArtBox position={[0,2.92,-2.61]} size={[14,.06,.07]} color="#829695" metal={.6}/>
    <ExhaustFan x={-4.4} reduced={reduced}/><ExhaustFan x={4.4} reduced={reduced}/>
    {[-4.5,0,4.5].map(x => <group key={x}><ArtBox position={[x,3.15,center]} size={[2,.08,.24]} color="#c4d2cb" glow={.7}/><pointLight position={[x,2.9,center]} color={x===0 ? "#ffd3a3" : "#b7ddd9"} intensity={7} distance={9}/></group>)}
    {Array.from({length:count+1},(_,i)=><ArtBox key={i} position={[0,.008,-1.65+i*3.2]} size={[14,.012,.025]} color="#6c7c7e"/>)}
    <ArtBox position={[-6.7,.7,-1.8]} size={[.8,1.4,.8]} color="#bf793f"/><ArtBox position={[-6.7,1.42,-1.8]} size={[.83,.08,.83]} color="#53676c"/>
    <ArtBox position={[6.4,.55,-1.85]} size={[1.4,1.1,.85]} color="#30454e"/>{[.3,.6,.9].map(y=><ArtBox key={y} position={[6.4,y,-1.4]} size={[1.2,.035,.03]} color="#8d9e9d"/>)}
    <ArtBox position={[-5.9,.018,(count-1)*3.2+1.5]} size={[1.2,.025,1]} color="#b8874d"/>
  </group>;
}
function Device({ kind, complete }: { kind: DeviceKind; complete: boolean }) {
  const screen = complete ? "#7dbfa8" : "#54a4b0";
  if (kind === "Laptop") return <group name="repair-device-laptop"><ArtBox position={[0,.04,0]} size={[1.05,.08,.7]} color="#a4adb0" metal={.6}/><ArtBox position={[0,.08,.05]} size={[.85,.025,.42]} color="#2a3b43"/><group position={[0,.36,-.27]} rotation={[-.2,0,0]}><ArtBox position={[0,0,0]} size={[1.05,.64,.055]} color="#394a52"/><ArtBox position={[0,0,.035]} size={[.92,.51,.01]} color={screen} glow={.35}/></group></group>;
  if (kind === "Controller" || kind === "Handheld") return <group name="repair-device-controller"><ArtBox position={[0,.12,0]} size={[.8,.18,.38]} color="#52666c"/>{[-1,1].map(s=><mesh key={s} position={[s*.36,.12,.14]} rotation={[Math.PI/2,0,0]}><capsuleGeometry args={[.14,.25,4,12]}/><meshStandardMaterial color="#2d424a"/></mesh>)}<ArtBox position={[0,.22,0]} size={[.27,.025,.24]} color={kind === "Handheld" ? screen : "#1c3038"} glow={.2}/>{[-.26,.26].map(x=><ArtBox key={x} position={[x,.24,0]} size={[.1,.04,.1]} color="#db955b"/>)}</group>;
  if (kind === "Smartphone" || kind === "Tablet") return <group name="repair-device-touch"><ArtBox position={[0,.05,0]} size={[kind === "Tablet" ? .72 : .4,.1,kind === "Tablet" ? .98 : .75]} color="#bcc4bf" metal={.5}/><ArtBox position={[0,.105,0]} size={[kind === "Tablet" ? .65 : .33,.015,kind === "Tablet" ? .84 : .61]} color={screen} glow={.28}/></group>;
  return <group name="repair-device-console"><ArtBox position={[0,.15,0]} size={[.9,.3,.66]} color="#bcc1b9" metal={.4}/>{[-.3,-.15,0,.15,.3].map(x=><ArtBox key={x} position={[x,.31,-.1]} size={[.035,.025,.35]} color="#33484e"/>)}<ArtBox position={[.32,.18,.34]} size={[.06,.06,.025]} color={screen} glow={.6}/></group>;
}
function Workbench({ station, row, now, selected, onSelect }: { station: Workstation; row: number; now: number; selected: boolean; onSelect: () => void }) {
  const progress = getRepairProgress(station.activeRepair,now), step = station.activeRepair ? getWorkshopStep(progress) : null;
  return <group name={`workbench-${station.id}`} position={[0,0,row*3.2]} onClick={event=>{event.stopPropagation();if(event.delta<5)onSelect()}}>
    <group position={[0,-.24,0]}>
    <ArtBox position={[0,.96,0]} size={[12,.16,1.15]} color="#8b9a9d" metal={.55}/><ArtBox position={[0,.78,-.46]} size={[12,.22,.14]} color="#334951"/>
    {[-5.6,-2,2,5.6].map(x=><ArtBox key={x} position={[x,.43,0]} size={[.12,.86,.85]} color="#3a535d" metal={.6}/>)}
    {WORKSHOP_STEP_X.map((x,i)=><group key={i} position={[x,0,0]}><ArtBox position={[0,1.055,0]} size={[2.4,.035,.8]} color={step===i ? "#446e70" : "#2a484f"}/><ArtBox position={[0,.258,1.7]} size={[2.4,.024,.055]} color={selected ? "#ee9a54" : "#829995"} glow={step===i ? .4 : 0}/><ArtBox position={[0,1.45,-.58]} size={[2.5,.7,.055]} color="#243a43"/>
      {[0,1,2].map(t=><ArtBox key={t} position={[-.7+t*.65,1.48,-.53]} size={[.08,.35,.035]} color={t===1 ? "#d39251" : "#95a9ae"} metal={.6}/>)}
      <ArtBox position={[.85,1.1,-.25]} size={[.35,.13,.3]} color={i===1 ? "#b67b49" : "#3d656d"}/><ArtBox position={[.85,1.21,-.25]} size={[.17,.08,.09]} color="#cbd9d0"/>
      {station.activeRepair && ((step??3)===i) && <group position={[0,1.09,.04]}><Device kind={station.activeRepair.order.device} complete={progress>=100}/></group>}
      <ArtBox position={[0,1.85,-.59]} size={[2.45,.055,.055]} color={step===i ? "#ffa759" : progress>=100 ? "#72c2a5" : "#71989d"} glow={step===i ? .65 : .15}/>
    </group>)}
    </group>
  </group>;
}
export function WorkshopActor({ name, appearance, homeZ, reduced, cosmetics, homeX=-5.9 }: { name: string; appearance: Character3DAppearance; targetX: number; targetZ: number; homeZ: number; working: boolean; reduced: boolean; cosmetics?:EquippedCharacterCosmetics;homeX?:number;clipboard?:boolean }) {
  return <group name={name} position={[homeX,.035,homeZ]}><mesh position={[0,.005,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.3,24]}/><meshBasicMaterial color="#19292d" transparent opacity={.55}/></mesh><group position={[0,.6,0]} rotation={[0,.2,0]} scale={.37}><FounderAvatar a={appearance} cosmetics={cosmetics} reduced={reduced}/></group></group>;
}
export function SpeechProjection({ element, actorName = "workshop-founder" }: { element: RefObject<HTMLDivElement | null>; actorName?:string }) {
  const point=useRef(new Vector3());
  useFrame(({scene,camera,size})=>{const actor=scene.getObjectByName(actorName),bubble=element.current;if(!actor||!bubble)return;actor.getWorldPosition(point.current);point.current.y+=1.65;point.current.project(camera);const half=bubble.offsetWidth/2;const x=Math.max(half+10,Math.min(size.width-half-10,(point.current.x+1)*size.width/2)),y=Math.max(bubble.offsetHeight+10,Math.min(size.height-10,(1-point.current.y)*size.height/2));bubble.style.setProperty("transform",`translate(${x}px,${y}px) translate(-50%,-100%)`);bubble.style.setProperty("visibility",Math.abs(point.current.x)>1||Math.abs(point.current.y)>1?"hidden":"visible")});return null;
}
class HallBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<div className="hall-unavailable">3D-Ansicht nicht verfügbar. Aufträge und Stationen bleiben bedienbar.</div>:this.props.children}}
export function WorkshopFloor3D({ state, now, selectedId, onSelect, reduced, mobile, reset, zoom, speech }: { state: GameState; now:number; selectedId:string; onSelect:(id:string)=>void; reduced:boolean; mobile:boolean; reset:number; zoom:number; speech:string|null }) {
  const stations=state.workstations.filter(s=>s.status!=="locked"),bubble=useRef<HTMLDivElement>(null);
  const manual=stations.filter(s=>s.activeRepair&&!s.activeRepair.assignedEmployeeId&&getRepairProgress(s.activeRepair,now)<100);
  const founderStation=manual.find(s=>s.id===selectedId)??manual[0],row=founderStation?stations.findIndex(s=>s.id===founderStation.id):0;
  const step=founderStation?getWorkshopStep(getRepairProgress(founderStation.activeRepair,now)):null;
  return <div className="workshop-floor-3d"><HallBoundary><Canvas aria-label="Interaktive 3D-Werkstatt" shadows dpr={[1,mobile?1:1.4]} frameloop={reduced?"demand":"always"} gl={{antialias:true,preserveDrawingBuffer:true}}>
    <color attach="background" args={["#172126"]}/><HallCamera count={stations.length} reset={reset} zoom={zoom}/><ambientLight intensity={.85}/><hemisphereLight args={["#b8d5dc","#51544a",1.2]}/><directionalLight position={[-5,15,8]} intensity={2.4} castShadow shadow-mapSize={mobile?[1024,1024]:[2048,2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-normalBias={.035}/>
    <Hall count={stations.length} reduced={reduced}/>{stations.map((station,i)=><Workbench key={station.id} station={station} row={i} now={now} selected={station.id===selectedId} onSelect={()=>onSelect(station.id)}/>)}
    {state.playerCharacter&&<WorkshopActor name="workshop-founder" appearance={getFounderAppearance(state.playerCharacter)} cosmetics={state.playerCharacter.equippedCosmetics} targetX={step===null?-5.9:WORKSHOP_STEP_X[step]} targetZ={step===null?(stations.length-1)*3.2+1.5:row*3.2+.86} homeZ={(stations.length-1)*3.2+1.5} working={step!==null} reduced={reduced}/>}
    {stations.filter(s=>s.assignedEmployeeId).map(station=>{const employee=state.employees.find(e=>e.id===station.assignedEmployeeId);if(!employee||!state.playerCharacter)return null;const step=station.activeRepair?getWorkshopStep(getRepairProgress(station.activeRepair,now)):null;return <WorkshopActor key={employee.id} name={`workshop-employee-${employee.id}`} appearance={{...getFounderAppearance(state.playerCharacter),outfit:"DARK",hair:"SHORT"}} targetX={step===null?-5.9:WORKSHOP_STEP_X[step]} targetZ={stations.indexOf(station)*3.2+.86} homeZ={stations.indexOf(station)*3.2+.86} working={step!==null} reduced={reduced}/>})}
    <SpeechProjection element={bubble}/>
  </Canvas></HallBoundary>{speech&&state.playerCharacter&&<div ref={bubble} className="workshop-speech" role="status"><strong>{state.playerCharacter.displayName}</strong><span>{speech}</span></div>}</div>;
}
