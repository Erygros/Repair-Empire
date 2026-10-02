"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DataTexture, RGBAFormat, SRGBColorSpace, Vector3, type Group, type Object3D } from "three";
import { getCampusFounderActivity } from "@/components/campus-walk";
import { Asphalt, CampusTree, DetailedVehicle, Entrance, Glazing, GrassBed, HallRoof, RoofEdges } from "@/components/campus-details";
import { FounderAvatar } from "@/components/character-3d";
import { getFounderAppearance } from "@/components/founder-appearance";
import type { BuildingType, PlayerCharacter } from "@/game/types";

type Point = [number, number, number];
export const CAMPUS_ACCENTS: Record<BuildingType, string> = { WORKSHOP: "#ef893c", TOOL_WAREHOUSE: "#c58a46", RESEARCH: "#58c6c4", PERSONNEL: "#90a9ac", FINANCE: "#a5b2c0", BUSINESS_OFFICE: "#c3ab85" };
export function ArtBox({ position, size, color, rotation = [0, 0, 0], glow = 0, metal = .15 }: { position: Point; size: Point; color: string; rotation?: Point; glow?: number; metal?: number }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={metal > .4 ? .48 : .82} metalness={metal} emissive={color} emissiveIntensity={glow}/></mesh>;
}
function Vent({ x, y, z, large = false }: { x: number; y: number; z: number; large?: boolean }) {
  return <group position={[x, y, z]}><ArtBox position={[0, .19, 0]} size={[large ? .9 : .55, .38, .6]} color="#727f83" metal={.6}/><ArtBox position={[0, .39, 0]} size={[large ? .7 : .4, .04, .42]} color="#283238"/>{[-.15, 0, .15].map(v => <ArtBox key={v} position={[v, .405, 0]} size={[.035, .025, .4]} color="#95a2a6"/>)}</group>;
}
function Gate({ x, z, h, w, warm = false }: { x: number; z: number; h: number; w: number; warm?: boolean }) {
  return <group position={[x, 0, z]}>
    <ArtBox position={[0, h / 2, 0]} size={[w, h, .06]} color={warm ? "#343e3b" : "#334048"}/>
    {[-1, 1].map(side => <ArtBox key={side} position={[side * (w / 2 + .05), h / 2, .05]} size={[.1, h + .12, .1]} color="#8a9292" metal={.65}/>)}
    <ArtBox position={[0, h + .03, .05]} size={[w + .2, .12, .13]} color="#aeb6ae"/>
    {Array.from({ length: warm ? 3 : 6 }, (_, i) => <ArtBox key={i} position={[0, warm ? h - .1 - i * .1 : .15 + i * h / 6, .05]} size={[w, .055, .035]} color="#56636a" metal={.6}/>)}
    {warm && <><ArtBox position={[0, .12, .15]} size={[w, .12, .25]} color="#393f40"/><ArtBox position={[0, h - .32, .085]} size={[w * .95, .025, .05]} color="#ffd199" glow={1.5}/><ArtBox position={[w * .23, .45, .095]} size={[.5, .09, .07]} color="#65544b"/><ArtBox position={[w * .23, .3, .1]} size={[.04, .3, .08]} color="#a1a9a2"/><ArtBox position={[-w * .25, .5, .1]} size={[.15, .4, .06]} color="#c1804d"/></>}
  </group>;
}
function Windows({ w, d, h, rows = 1, cyan = false, entrance = false }: { w: number; d: number; h: number; rows?: number; cyan?: boolean; entrance?: boolean }) {
  return <>{Array.from({ length: rows }, (_, row) => Array.from({ length: 4 }, (_, i) => entrance && row === 0 && (i === 1 || i === 2) ? null : <group key={`${row}-${i}`}>
    <group position={[(i - 1.5) * w / 4.6, .7 + row * .85, d / 2 + .04]}><Glazing width={w / 6} height={.48} lit={!cyan && (i + row) % 3 === 0}/></group>
  </group>))}{[-.3, .3].map(z => <group key={z} position={[w / 2 + .035, h * .55, z * d]} rotation={[0, Math.PI / 2, 0]}><Glazing width={d * .22} height={.55}/></group>)}</>;
}
function Pallet({ x, z, crates = true }: { x: number; z: number; crates?: boolean }) {
  return <group position={[x, .1, z]}><ArtBox position={[0, .08, 0]} size={[.7, .16, .6]} color="#776451"/>{[-.22, 0, .22].map(v => <ArtBox key={v} position={[v, .18, 0]} size={[.12, .04, .6]} color="#a48968"/>)}{crates && <><ArtBox position={[0, .42, 0]} size={[.58, .43, .5]} color="#56666b"/><ArtBox position={[0, .43, .255]} size={[.03, .4, .01]} color="#baa782"/></>}</group>;
}
export function BuildingArt({ id, w, d, tier, selected, hovered }: { id: BuildingType; w: number; d: number; tier: number; selected: boolean; hovered: boolean }) {
  const accent = CAMPUS_ACCENTS[id], active = selected || hovered;
  const h = id === "FINANCE" ? 2.7 + tier * .16 : id === "RESEARCH" ? 1.95 + tier * .15 : id === "PERSONNEL" ? 1.8 + tier * .15 : 1.35 + tier * .16;
  return <group name={`art-${id}-tier-${tier}`}>
    <ArtBox position={[0, .035, 0]} size={[w + .45, .14, d + .45]} color="#5c6564"/>
    {active && [-1, 1].map(side => <group key={side}><ArtBox position={[side * (w / 2 + .25), .13, 0]} size={[.055, .025, d + .55]} color={selected ? "#d38c47" : "#738f93"} glow={.22}/><ArtBox position={[0, .13, side * (d / 2 + .25)]} size={[w + .55, .025, .055]} color={selected ? "#d38c47" : "#738f93"} glow={.22}/></group>)}
    {id !== "WORKSHOP" && <RoofEdges w={id === "FINANCE" ? w * .78 : w + .16} d={id === "BUSINESS_OFFICE" ? d * .8 : d + .12} x={id === "FINANCE" ? -w * .09 : 0} z={id === "BUSINESS_OFFICE" ? -d * .12 : 0} y={h + (id === "BUSINESS_OFFICE" ? .13 : .19)}/>}
    {id === "WORKSHOP" && <>
      <ArtBox position={[w * .1, h * .62, 0]} size={[w * .78, h * 1.24, d]} color="#546065" metal={.35}/>
      <ArtBox position={[-w * .4, .58 + (tier >= 4 ? .35 : 0), 0]} size={[w * .22, tier >= 4 ? 1.8 : 1.16, d * (tier >= 2 ? .94 : .78)]} color="#3a484d"/>
      <ArtBox position={[-w * .4, tier >= 4 ? 1.86 : 1.22, 0]} size={[w * .25, .12, d * (tier >= 2 ? .98 : .82)]} color="#252e34" metal={.65}/>
      <HallRoof x={w * .1} y={h * 1.24} w={w} d={d}/>
      {Array.from({ length: tier >= 3 ? 3 : 2 }, (_, i) => <Gate key={i} x={w * .1 + (i - (tier >= 3 ? 1 : .5)) * 1.35} z={d / 2 + .045} w={1.05} h={1.23} warm/>)}
      <ArtBox position={[w * .1, 1.62, d / 2 + .12]} size={[w * .7, .26, .11]} color="#262f33"/>
      <ArtBox position={[w * .1, 1.61, d / 2 + .185]} size={[w * .58, .075, .025]} color={accent} glow={.55}/>
      {Array.from({ length: 12 }, (_, i) => <ArtBox key={i} position={[w * .49 + .01, h * .62, -d / 2 + i * d / 11]} size={[.03, h * 1.24, .025]} color="#73807c" metal={.5}/>)}
      {tier >= 2 && <><ArtBox position={[-w * .4, .7, d * .47 + .02]} size={[w * .18, 1.2, .06]} color="#31434a"/><Vent x={-w * .4} y={tier >= 4 ? 1.93 : 1.29} z={-.35}/></>}
      {tier >= 3 && <Vent x={-w * .4} y={tier >= 4 ? 1.93 : 1.29} z={.65} large/>}
      {tier >= 4 && <ArtBox position={[-w * .4, 1.35, d * .48]} size={[w * .15, .4, .06]} color="#997b59" glow={.25}/>}
      {tier >= 5 && <ArtBox position={[w * .45, .5, d / 2 + .3]} size={[.15, .9, .2]} color="#b6733c" glow={.3}/>}
      <ArtBox position={[0, .06, d / 2 + .55]} size={[w * .75, .08, .75]} color="#657070"/><Pallet x={-w * .46} z={d / 2 + .3}/>
      <pointLight position={[w * .1, 1, d / 2 + .45]} color="#ffbc7a" intensity={3} distance={4}/>
    </>}
    {id === "TOOL_WAREHOUSE" && <>
      <ArtBox position={[0, h / 2, 0]} size={[w, h, d]} color="#424e54" metal={.4}/><ArtBox position={[0, h + .08, 0]} size={[w + .15, .18, d + .15]} color="#293339" metal={.65}/>
      {Array.from({ length: 9 }, (_, i) => <ArtBox key={i} position={[-w / 2 + i * w / 8, h / 2, d / 2 + .02]} size={[.045, h, .045]} color="#657179" metal={.6}/>)}
      <Gate x={-.6} z={d / 2 + .08} h={1.2} w={2.1}/><ArtBox position={[-.6, .15, d / 2 + .52]} size={[2.5, .3, .9]} color="#697476"/>
      <ArtBox position={[w * .37, .8, d / 2 + .09]} size={[.18, .12, .12]} color="#dfd4b5" glow={.6}/><Pallet x={w * .35} z={d / 2 + .5}/><Vent x={w * .3} y={h + .19} z={-.7}/>
      {tier >= 2 && <ArtBox position={[0, h + .35, -.6]} size={[w * .55, .45, .7]} color="#606d71"/>}{tier >= 3 && <ArtBox position={[w * .35, .5, d / 2 + .3]} size={[.7, .8, .5]} color="#a47142"/>}
    </>}
    {id === "RESEARCH" && <>
      <ArtBox position={[0, h / 2, 0]} size={[w, h, d]} color="#55656c"/><ArtBox position={[0, h + .09, 0]} size={[w + .18, .18, d + .18]} color="#2c3c42" metal={.55}/>
      <group position={[-w * .12, h * .5, d / 2 + .04]}><Glazing width={w * .72} height={h * .72}/></group>
      {[-.35, -.1, .15].map(x => <ArtBox key={x} position={[x * w, h * .5, d / 2 + .1]} size={[.05, h * .76, .04]} color="#9aaeb0"/>)}
      <ArtBox position={[w * .42, h * .48, d / 2 + .11]} size={[.045, h * .75, .05]} color={accent} glow={.55}/><Vent x={-w * .25} y={h + .2} z={-.5} large/>
      <ArtBox position={[w * .2, h + .45, -.35]} size={[.7, .6, .7]} color="#899a9d"/><ArtBox position={[w * .2, h + 1.13, -.35]} size={[.035, .8, .035]} color="#b3c2c1" metal={.6}/><ArtBox position={[w * .2, h + 1.4, -.35]} size={[.65, .04, .035]} color="#8da4a8"/>
      <Entrance x={w * .34} z={d / 2 + .12} width={.45}/>
      {tier >= 2 && <Vent x={w * .31} y={h + .2} z={.65} large/>}{tier >= 3 && <ArtBox position={[-w * .3, h + .43, .6]} size={[1.2, .5, .65]} color="#4a929b"/>}
      <pointLight position={[w * .4, 1, d / 2 + .45]} color="#80d7d2" intensity={2} distance={3}/>
    </>}
    {id === "PERSONNEL" && <>
      <ArtBox position={[0, h / 2, 0]} size={[w, h, d]} color="#697572"/><ArtBox position={[0, h + .09, 0]} size={[w + .18, .18, d + .18]} color="#3c484c"/>
      <Windows w={w} d={d} h={h} rows={2} entrance/><Entrance x={0} z={d / 2 + .12}/>
      <ArtBox position={[0, 1.18, d / 2 + .32]} size={[1.1, .09, .65]} color="#8b9796" metal={.6}/>
      {tier >= 2 && <Vent x={-.8} y={h + .2} z={-.3}/>} {tier >= 3 && <ArtBox position={[0, h + .42, 0]} size={[w * .6, .5, d * .5]} color="#4e6167"/>}
    </>}
    {id === "FINANCE" && <>
      <ArtBox position={[-w * .09, h / 2, 0]} size={[w * .74, h, d]} color="#68757e"/><ArtBox position={[w * .38, h * .43, 0]} size={[w * .23, h * .86, d * .9]} color="#374a53"/>
      <group position={[-w * .12, h * .55, d / 2 + .04]}><Glazing width={w * .3} height={h * .7}/></group>
      {Array.from({ length: 3 }, (_, i) => <ArtBox key={i} position={[-w * .12, .7 + i * .78, d / 2 + .1]} size={[w * .35, .07, .06]} color="#b0b8b8"/>)}
      <ArtBox position={[-w * .09, h + .07, 0]} size={[w * .78, .14, d + .12]} color="#27353d"/>
      <Entrance x={w * .3} z={d / 2 + .06} width={.5}/>
      {tier >= 2 && <ArtBox position={[w * .37, h * .87, 0]} size={[w * .26, .18, d]} color="#94a4ab"/>}{tier >= 3 && <Vent x={-.7} y={h + .16} z={-.3}/>} 
    </>}
    {id === "BUSINESS_OFFICE" && <>
      <ArtBox position={[0, h / 2, -d * .12]} size={[w, h, d * .74]} color="#667073"/><ArtBox position={[0, h + .06, -d * .12]} size={[w + .16, .13, d * .8]} color="#33454a"/>
      <Windows w={w} d={d * .5} h={h}/><ArtBox position={[w * .16, .64, d * .36]} size={[w * .5, 1.2, d * .3]} color="#4f777d" metal={.5} glow={.12}/>
      <ArtBox position={[w * .16, 1.32, d * .41]} size={[w * .58, .12, d * .5]} color="#a29d8b" metal={.5}/><ArtBox position={[w * .16, .65, d * .52]} size={[.055, 1.3, .035]} color="#c1c7c1"/>
      <Entrance x={w * .16} z={d * .52 + .04}/>
      {[-.15, .35].map(offset => <group key={offset} position={[w * offset, .72, d * .52 + .02]}><Glazing width={w * .18} height={.85}/></group>)}
      {tier >= 2 && <ArtBox position={[-w * .3, h + .3, -.4]} size={[1, .42, .8]} color="#455f67"/>}{tier >= 3 && <Vent x={w * .33} y={h + .15} z={-.5}/>} 
    </>}
  </group>;
}
function Lamp({ x, z }: { x: number; z: number }) {
  const pool = useMemo(() => { const pixels = new Uint8Array(32 * 32 * 4); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const radius = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5); pixels.set([255, 207, 133, Math.round(Math.max(0, 1 - radius) ** 2 * 255)], (y * 32 + x) * 4); } const texture = new DataTexture(pixels, 32, 32, RGBAFormat); texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true; return texture; }, []);
  useEffect(() => () => pool.dispose(), [pool]);
  return <group name="campus-streetlamp" position={[x, .12, z]}><ArtBox position={[0, 1.35, 0]} size={[.055, 2.7, .055]} color="#7c8b8c" metal={.6}/><ArtBox position={[.2, 2.67, 0]} size={[.45, .08, .16]} color="#59676a"/><ArtBox position={[.2, 2.62, 0]} size={[.32, .025, .13]} color="#ffe0a3" glow={2}/>
    <pointLight position={[.2, 2.55, 0]} color="#ffd295" intensity={12} distance={5} decay={2}/>
    <mesh position={[.2, .025, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3, 3]}/><meshBasicMaterial map={pool} transparent opacity={.28} depthWrite={false}/></mesh>
  </group>;
}
export function CampusGround({ mobile }: { mobile: boolean }) {
  return <group name="industrial-campus-ground">
    <ArtBox position={[0, -.2, 0]} size={[29, .5, 18]} color="#353d40"/>
    <Asphalt/><Asphalt road/>
    <GrassBed x={0} z={-7.2} width={26} depth={.85}/><GrassBed x={-12.5} z={3.6} width={1} depth={3}/><GrassBed x={12.4} z={-.5} width={1} depth={6}/>
    {Array.from({ length: 15 }, (_, i) => <ArtBox key={i} position={[-13 + i * 1.8, .135, 7.6]} size={[.7, .025, .045]} color="#afb8b4"/>)}
    {[-12.2, -9.2, -6.2, -3.2].map(x => <ArtBox key={x} position={[x, .14, 5.925]} size={[.035, .012, 1.15]} color="#c0c5b8"/>)}
    <ArtBox position={[-7.7, .14, 6.5]} size={[9, .012, .035]} color="#c0c5b8"/>
    <ArtBox position={[-6.6, .11, -.35]} size={[3.4, .04, 1.5]} color="#3d474b"/>
    {[-8.1, -6.6, -5.1].map(x => <ArtBox key={x} position={[x, .145, -.35]} size={[.035, .025, 1.3]} color="#879590"/>)}
    {Array.from({ length: 9 }, (_, i) => <ArtBox key={i} position={[-11 + i * 2.6, .1, -.8 + (i % 3) * 2]} size={[.32, .025, .025]} color="#8e9690" rotation={[0, i * .31, 0]}/>)}
    {[-1, 1].map(side => <ArtBox key={side} position={[side * 13.4, .2, 0]} size={[.13, .23, 15.5]} color="#7c8785"/>)}
    {Array.from({ length: 13 }, (_, i) => <ArtBox key={i} position={[-13 + i * 2.2, .6, -8.1]} size={[.055, 1, .055]} color="#768386" metal={.7}/>)}
    {[.35, .75].map(y => <ArtBox key={y} position={[0, y, -8.1]} size={[28, .045, .045]} color="#66767b" metal={.7}/>)}
    <ArtBox position={[-12.2, .16, -.8]} size={[1.7, .08, 2.8]} color="#485255"/><ArtBox position={[11.7, .16, 5.4]} size={[2.7, .08, 1.8]} color="#485255"/>
    {Array.from({ length: 4 }, (_, i) => <ArtBox key={i} position={[10.8 + i * .6, .22, 5.4]} size={[.06, .025, 1.5]} color="#aa874d" rotation={[0, -.4, 0]}/>)}
    <ArtBox position={[12, .62, 4.75]} size={[1.7, 1, .65]} color="#4d636b"/>
    {Array.from({ length: 6 }, (_, i) => <ArtBox key={i} position={[11.3 + i * .28, .62, 5.09]} size={[.03, .9, .025]} color="#71878b"/>)}
    <ArtBox position={[-4.3, .52, -1.2]} size={[.45, .8, .55]} color="#69777b"/><ArtBox position={[-4.3, .55, -.91]} size={[.25, .15, .04]} color="#bb8749"/>
    <DetailedVehicle x={-7.7} z={5.925}/><DetailedVehicle x={1.6} z={3.1} van/>
    <Lamp x={-10.5} z={5.9}/><Lamp x={5} z={5.9}/>{!mobile && <><Lamp x={-4.5} z={-4.1}/><Pallet x={10.6} z={4.5}/><Pallet x={10.7} z={5.8} crates={false}/></>}
    {[-12.2, 11.8].map(x => <CampusTree key={x} x={x}/>)}
    {[-2.2, 2.2].map(x => <ArtBox key={x} position={[x, .36, 1.95]} size={[.09, .6, .09]} color="#b5864e"/>)}
  </group>;
}
export function MapFounder({ character, onOpen, reduced }: { character: PlayerCharacter; onOpen: () => void; reduced: boolean }) {
  const walker = useRef<Group>(null), body = useRef<Group>(null), elapsed = useRef(0);
  const phone = useRef<Group>(null), handPoint = useMemo(() => new Vector3(), []);
  const limbs = useRef<{ leftArm?: Object3D; rightArm?: Object3D; leftLeg?: Object3D; rightLeg?: Object3D; hand?: Object3D; head?: Object3D }>({});
  useEffect(() => {
    const model = body.current; if (!model) return;
    limbs.current = { leftArm: model.getObjectByName("arm--1"), rightArm: model.getObjectByName("arm-1"), leftLeg: model.getObjectByName("trouser-leg--1")?.parent ?? undefined, rightLeg: model.getObjectByName("trouser-leg-1")?.parent ?? undefined, hand: model.getObjectByName("hand-1"), head: model.getObjectByName("head") };
    // Pivot the map instance's legs at the hips without changing the creator model.
    const legs = [limbs.current.leftLeg, limbs.current.rightLeg].filter((leg): leg is Object3D => !!leg);
    for (const leg of legs) { leg.position.y += 1.35; for (const child of leg.children) child.position.y -= 1.35; }
    return () => { for (const leg of legs) { leg.position.y -= 1.35; for (const child of leg.children) child.position.y += 1.35; } };
  }, []);
  useFrame((_, delta) => {
    if (!walker.current || !body.current) return;
    if (!reduced) elapsed.current += Math.min(delta, .05);
    const pose = getCampusFounderActivity(reduced ? 0 : elapsed.current), stride = reduced || pose.phone ? 0 : pose.stride * .34;
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 12);
    const turn = (pose.phone ? .35 : pose.direction * Math.PI / 2) - body.current.rotation.y;
    walker.current.position.x = pose.x;
    body.current.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * blend;
    body.current.position.y = .6 + Math.abs(stride) * .035;
    if (limbs.current.leftArm) limbs.current.leftArm.rotation.x += ((pose.phone ? -.8 : -stride) - limbs.current.leftArm.rotation.x) * blend;
    if (limbs.current.rightArm) limbs.current.rightArm.rotation.x += ((pose.phone ? -1.35 : stride) - limbs.current.rightArm.rotation.x) * blend;
    if (limbs.current.leftLeg) limbs.current.leftLeg.rotation.x = stride;
    if (limbs.current.rightLeg) limbs.current.rightLeg.rotation.x = -stride;
    if (limbs.current.head) limbs.current.head.rotation.x += ((pose.phone ? .24 : 0) - limbs.current.head.rotation.x) * blend;
    if (phone.current) {
      phone.current.visible = pose.phone && !reduced;
      if (limbs.current.hand) {
        body.current.updateWorldMatrix(true, true);
        limbs.current.hand.getWorldPosition(handPoint);
        phone.current.position.copy(body.current.worldToLocal(handPoint));
        phone.current.position.y += .09;
      }
    }
  });
  const a = getFounderAppearance(character);
  return <group ref={walker} name="campus-founder" position={[0, .125, 7.6]} onClick={event => { event.stopPropagation(); if (event.delta < 5) onOpen(); }}>
    <mesh position={[0, .008, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.3, 24]}/><meshBasicMaterial color="#141b1e" transparent opacity={.5}/></mesh>
    <group ref={body} position={[0, .6, 0]} scale={.37}><FounderAvatar a={a} reduced/><group ref={phone} name="campus-founder-phone" visible={false} position={[.4, .3, .3]} rotation={[-.3, 0, 0]}><ArtBox position={[0, 0, 0]} size={[.15, .27, .025]} color="#192326"/><ArtBox position={[0, 0, .016]} size={[.125, .22, .005]} color="#8cbcd0" glow={.7}/></group></group>
  </group>;
}
