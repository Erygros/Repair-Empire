"use client";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Focus, Minus, Plus, UserRound } from "lucide-react";
import type { Group, OrthographicCamera as Camera } from "three";
import { ArtBox } from "@/components/campus-art";
import { Glazing } from "@/components/campus-details";
import { FounderAvatar } from "@/components/character-3d";
import { getFounderAppearance } from "@/components/founder-appearance";
import { SpeechProjection, WorkshopActor } from "@/components/workshop-floor-3d";
import { DEPARTMENT_NAMES, getDepartmentActivity, type Department } from "@/components/department-animation";
import { getCurrentTime } from "@/game/logic/time";
import type { GameState } from "@/game/types";
import "./workshop-industrial.css";
import "./department-scenes.css";

function RoomCamera({reset,zoom}:{reset:number;zoom:number}) {
  const {size,invalidate}=useThree(),camera=useRef<Camera>(null);
  useEffect(()=>{const c=camera.current;if(!c)return;c.position.set(11,12,16);c.lookAt(0,.65,0);c.zoom=Math.min(size.width/15,size.height/11)*Math.pow(1.2,zoom);c.updateProjectionMatrix();invalidate();},[size.width,size.height,reset,zoom,invalidate]);
  return <><OrthographicCamera ref={camera} makeDefault position={[11,12,16]} near={.1} far={100}/><OrbitControls key={reset} target={[0,.65,0]} enablePan enableZoom={false} minPolarAngle={.35} maxPolarAngle={1.2}/></>;
}
function Desk({x=0,z=-.8,computer=false,rotation=0}:{x?:number;z?:number;computer?:boolean;rotation?:number}) {
  return <group name="department-desk" position={[x,0,z]} rotation={[0,rotation,0]}><ArtBox position={[0,.84,0]} size={[2.1,.12,.85]} color="#a49c89" metal={.1}/>{[-.85,.85].map(v=><ArtBox key={v} position={[v,.42,0]} size={[.08,.84,.65]} color="#53666d" metal={.6}/>)}{computer&&<><ArtBox position={[0,1.22,-.15]} size={[.85,.5,.06]} color="#23363c"/><ArtBox position={[0,1.22,-.11]} size={[.76,.4,.02]} color="#69aaa7" glow={.5}/><ArtBox position={[0,.98,-.15]} size={[.055,.25,.055]} color="#829792"/><ArtBox position={[0,.92,.18]} size={[.65,.035,.22]} color="#42545b"/>{[0,1,2,3].map(i=><ArtBox key={i} position={[-.23+i*.15,.945,.18]} size={[.08,.012,.12]} color="#9baba9"/>)}</>}</group>;
}
function Chair({x,z,rotation=0}:{x:number;z:number;rotation?:number}) {
  return <group name="department-chair" position={[x,0,z]} rotation={[0,rotation,0]}><ArtBox position={[0,.45,0]} size={[.55,.12,.55]} color="#526a6b"/><ArtBox position={[0,.74,.25]} size={[.55,.55,.1]} color="#526a6b"/>{[-1,1].flatMap(a=>[-1,1].map(b=><ArtBox key={`${a}-${b}`} position={[a*.2,.23,b*.2]} size={[.04,.46,.04]} color="#a6b0a9" metal={.7}/>))}</group>;
}
function Shelf({x,tools=false}:{x:number;tools?:boolean}) {
  return <group position={[x,0,-2.15]}>{[-1,1].map(v=><ArtBox key={v} position={[v*.8,1.1,0]} size={[.075,2.2,.65]} color="#81918c" metal={.7}/>)}{[.25,.9,1.55,2.15].map((y,row)=><group key={y}><ArtBox position={[0,y,0]} size={[1.7,.07,.7]} color="#718382" metal={.6}/>{[-.52,0,.52].map((v,i)=><group key={v}><ArtBox position={[v,y+.2,0]} size={[.43,.32,.45]} color={tools&&row%2===0?"#b9844d":i%2?"#628985":"#52666b"}/><ArtBox position={[v,y+.2,.235]} size={[.22,.045,.015]} color="#d7d8c8"/></group>)}</group>)}</group>;
}
function Rotor({reduced}:{reduced:boolean}) {
  const rotor=useRef<Group>(null);
  useFrame((_,dt)=>{if(rotor.current&&!reduced)rotor.current.rotation.y+=Math.min(dt,.05)*.9;});
  return <group position={[2.4,1.2,-1.2]}><ArtBox position={[0,-.2,0]} size={[.9,.5,.75]} color="#bcc6c0"/><group ref={rotor}>{[0,1,2,3].map(i=><group key={i} rotation={[0,i*Math.PI/2,0]}><ArtBox position={[0,0,.24]} size={[.12,.12,.4]} color="#738f95" metal={.7}/></group>)}</group></group>;
}
function Furnishings({department,reduced,state}:{department:Department;reduced:boolean;state:GameState}) {
  const office=department==="economy"||department==="customers";
  return <group name={`department-${department}-furnishings`}>
    {department==="tools"&&<><Shelf x={-2.8} tools/><Shelf x={2.8} tools/><Desk/>{[-.6,-.2,.2,.6].map(x=><group key={x}><ArtBox position={[x,.94,-.8]} size={[.06,.045,.4]} color="#adbdba" metal={.8}/><ArtBox position={[x,.94,-.57]} size={[.09,.08,.16]} color="#d6934b"/></group>)}</>}
    {department==="team"&&<><Desk/><Chair x={-1} z={-.1}/><Chair x={1} z={-.1}/><Chair x={0} z={-1.5} rotation={Math.PI}/>{[-3,-2.35,-1.7].map(x=><group key={x}><ArtBox position={[x,1.05,-2.2]} size={[.6,2.1,.6]} color="#71857e"/><ArtBox position={[x+.17,1,-1.89]} size={[.025,.15,.03]} color="#d2d5c7"/>{[1.5,1.6,1.7].map(y=><ArtBox key={y} position={[x,y,-1.89]} size={[.35,.02,.015]} color="#35484b"/>)}</group>)}<Desk x={3} z={-1.8}/><ArtBox position={[3,1.08,-1.8]} size={[.35,.38,.32]} color="#35494d"/>{state.employees.slice(0,2).map((e,i)=>state.playerCharacter&&<group key={e.id} name={`department-employee-${e.id}`} position={[2+i*.9,.6,.2]} scale={.37}><FounderAvatar a={{...getFounderAppearance(state.playerCharacter),outfit:"DARK"}} reduced={reduced}/></group>)}</>}
    {office&&<><Desk x={department==="economy"?-1.8:0} computer rotation={Math.PI}/><Chair x={department==="economy"?-1.8:0} z={-1.8} rotation={Math.PI}/>{department==="economy"?<><Desk x={1.3} computer rotation={Math.PI}/><Chair x={1.3} z={-1.8} rotation={Math.PI}/><Shelf x={3.2}/><ArtBox position={[-3,1.7,-2.55]} size={[1.5,1.1,.08]} color="#315653"/>{[0,1,2,3].map(i=><ArtBox key={i} position={[-3.5+i*.32,1.5+i*.13,-2.49]} size={[.16,.3+i*.18,.025]} color="#91b8a4"/>)}</>:<><ArtBox position={[-3,.43,.1]} size={[1.7,.55,.75]} color="#637c70"/><ArtBox position={[-3,.77,-.22]} size={[1.7,.65,.15]} color="#637c70"/><ArtBox position={[0,.035,1.6]} size={[3.7,.025,.75]} color="#66757b"/></>}</>}
    {department==="research"&&<><Desk x={-2.4}/><Desk x={2.4}/><Rotor reduced={reduced}/><ArtBox position={[-2.4,1,-.8]} size={[.6,.18,.5]} color="#a9bdb7"/><ArtBox position={[-2.45,1.35,-.85]} size={[.075,.6,.075]} color="#6b8589"/><ArtBox position={[-2.3,1.6,-.7]} size={[.3,.12,.16]} color="#c0c9bd" rotation={[.4,0,0]}/><Shelf x={0}/>{[-.35,0,.35].map(x=><ArtBox key={x} position={[x,2.52,-2.36]} size={[.09,.4,.06]} color="#a7d5c5" glow={.5}/>)}</>}
    {(department==="challenges"||department==="upgrades")&&<><Desk x={-2.2} computer/><Desk x={2.2}/><ArtBox position={[0,1.85,-2.54]} size={[3.6,1.4,.09]} color={department==="challenges"?"#596b5d":"#526d74"}/>{Array.from({length:6},(_,i)=><ArtBox key={i} position={[-1.3+(i%3)*1.1,1.5+Math.floor(i/3)*.6,-2.475]} size={[.75,.4,.015]} color={i%2?"#c7cbbb":"#c89359"}/>)}{department==="upgrades"&&<><ArtBox position={[2.2,1.14,-.8]} size={[1.3,.5,.65]} color="#6f9294"/><ArtBox position={[2.2,1.42,-.8]} size={[1.1,.035,.45]} color="#abbbaf"/></>}</>}
  </group>;
}
function Room({department,reduced,state}:{department:Department;reduced:boolean;state:GameState}) {
  return <group name={`department-room-${department}`}>
    <ArtBox position={[0,-.12,0]} size={[10,.24,7]} color="#61706e"/><ArtBox position={[0,1.6,-2.7]} size={[10,3.2,.18]} color="#60716e"/><ArtBox position={[-4.9,1.15,0]} size={[.16,2.3,5.4]} color="#3e5358"/>
    {Array.from({length:10},(_,i)=><ArtBox key={i} position={[-4.5+i,.015,0]} size={[.015,.015,7]} color="#78827a"/>)}
    <ArtBox position={[0,3.15,-2.55]} size={[9.5,.1,.18]} color="#9cac9f"/>
    <group position={[-4.8,1.6,0]} rotation={[0,Math.PI/2,0]}><Glazing width={2.6} height={1.1}/></group>
    {[-3,0,3].map(x=><group key={x}><ArtBox position={[x,2.94,-1.3]} size={[1.5,.07,.2]} color="#d6dfcf" glow={.8}/><pointLight position={[x,2.8,-1.1]} color={department==="research"?"#b0d9d8":"#ffddad"} intensity={5} distance={6}/></group>)}
    <ArtBox position={[4,1.15,-2.52]} size={[.45,.8,.08]} color="#526d65"/><ArtBox position={[4,1.16,-2.46]} size={[.3,.6,.02]} color="#88ad94"/>
    <Furnishings department={department} reduced={reduced} state={state}/>
  </group>;
}
class RoomBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<div className="hall-unavailable">3D-Ansicht nicht verfügbar. Die Spielaktionen bleiben erreichbar.</div>:this.props.children;}}

export function DepartmentScene({department,state,motion,onProfile}:{department:Department;state:GameState;motion:"AUTO"|"FULL"|"REDUCED";onProfile:()=>void}) {
  const [seconds,setSeconds]=useState(0),[systemReduced,setSystemReduced]=useState(false),[mobile,setMobile]=useState(false),[reset,setReset]=useState(0),[zoom,setZoom]=useState(0),bubble=useRef<HTMLDivElement>(null);
  useEffect(()=>{const media=matchMedia("(prefers-reduced-motion:reduce)"),phone=matchMedia("(max-width:620px)");const update=()=>{setSystemReduced(media.matches);setMobile(phone.matches);};update();media.addEventListener("change",update);phone.addEventListener("change",update);return()=>{media.removeEventListener("change",update);phone.removeEventListener("change",update);};},[]);
  const reduced=motion==="REDUCED"||(motion==="AUTO"&&systemReduced);
  useEffect(()=>{if(reduced)return;const started=getCurrentTime(),timer=setInterval(()=>setSeconds((getCurrentTime()-started)/1000),500);return()=>clearInterval(timer);},[department,reduced]);
  const activity=getDepartmentActivity(reduced?0:seconds,department),character=state.playerCharacter;
  return <section className="department-scene" aria-label={DEPARTMENT_NAMES[department]}><header><div><p className="panel-label">REPAIR EMPIRE / {character?.displayName??"FOUNDER"}</p><h3>{DEPARTMENT_NAMES[department]}</h3></div><button title="Founder bearbeiten" aria-label="Founder bearbeiten" onClick={onProfile}><UserRound size={17}/></button></header>
    <div className="department-stage"><RoomBoundary><Canvas aria-label={`Interaktiver 3D-Raum: ${DEPARTMENT_NAMES[department]}`} shadows dpr={[1,mobile?1:1.4]} frameloop={reduced?"demand":"always"} gl={{antialias:true,preserveDrawingBuffer:true}}>
      <color attach="background" args={["#172126"]}/><RoomCamera reset={reset} zoom={zoom}/><ambientLight intensity={.9}/><hemisphereLight args={["#cadbd5","#5c6154",1.1]}/><directionalLight position={[-5,12,8]} intensity={2.2} castShadow shadow-mapSize={mobile?[1024,1024]:[2048,2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.03}/>
      <Room department={department} reduced={reduced} state={state}/>{character&&<WorkshopActor name="department-founder" appearance={getFounderAppearance(character)} cosmetics={character.equippedCosmetics} targetX={activity.targetX} targetZ={activity.targetZ} homeX={-2.4} homeZ={1.9} clipboard working={activity.working} reduced={reduced}/>}
      <SpeechProjection element={bubble} actorName="department-founder"/>
    </Canvas></RoomBoundary>{activity.speech&&character&&<div ref={bubble} className="workshop-speech" role="status"><strong>{character.displayName}</strong><span>{activity.speech}</span></div>}
      <div className="hall-camera" role="group" aria-label="Raumkamera"><button aria-label="Raum vergrößern" title="Vergrößern" onClick={()=>setZoom(v=>Math.min(3,v+1))}><Plus size={17}/></button><button aria-label="Raum verkleinern" title="Verkleinern" onClick={()=>setZoom(v=>Math.max(-1,v-1))}><Minus size={17}/></button><button aria-label="Raum zentrieren" title="Ansicht zurücksetzen" onClick={()=>{setReset(v=>v+1);setZoom(0);}}><Focus size={17}/></button></div>
    </div></section>;
}
