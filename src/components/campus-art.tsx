"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DataTexture, RepeatWrapping, RGBAFormat, SRGBColorSpace, type Group, type Object3D } from "three";
import { getCampusWalkPose } from "@/components/campus-walk";
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
    <ArtBox position={[0, h / 2, 0]} size={[w, h, .06]} color={warm ? "#e0a46a" : "#334048"} glow={warm ? .35 : 0}/>
    {[-1, 1].map(side => <ArtBox key={side} position={[side * (w / 2 + .05), h / 2, .05]} size={[.1, h + .12, .1]} color="#8a9292" metal={.65}/>)}
    <ArtBox position={[0, h + .03, .05]} size={[w + .2, .12, .13]} color="#aeb6ae"/>
    {Array.from({ length: warm ? 3 : 6 }, (_, i) => <ArtBox key={i} position={[0, warm ? h - .1 - i * .1 : .15 + i * h / 6, .05]} size={[w, .055, .035]} color="#56636a" metal={.6}/>)}
    {warm && <><ArtBox position={[0, .12, .15]} size={[w, .12, .25]} color="#393f40"/><ArtBox position={[0, h - .32, .085]} size={[w * .95, .025, .05]} color="#ffd199" glow={.8}/><ArtBox position={[w * .23, .45, .095]} size={[.5, .09, .07]} color="#65544b"/></>}
  </group>;
}
function Windows({ w, d, h, rows = 1, cyan = false }: { w: number; d: number; h: number; rows?: number; cyan?: boolean }) {
  return <>{Array.from({ length: rows }, (_, row) => Array.from({ length: 4 }, (_, i) => <group key={`${row}-${i}`}>
    <ArtBox position={[(i - 1.5) * w / 4.6, .62 + row * .85, d / 2 + .04]} size={[w / 6, .48, .07]} color={cyan ? "#48898e" : "#8c8070"} glow={cyan ? .2 : .13} metal={.4}/>
    <ArtBox position={[(i - 1.5) * w / 4.6, .62 + row * .85, d / 2 + .09]} size={[.04, .51, .035]} color="#263337"/>
  </group>))}{[-.3, .3].map(z => <ArtBox key={z} position={[w / 2 + .035, h * .55, z * d]} size={[.07, .55, d * .22]} color={cyan ? "#48898e" : "#8c8070"} glow={.12}/>)}</>;
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
    {id === "WORKSHOP" && <>
      <ArtBox position={[w * .1, h * .62, 0]} size={[w * .78, h * 1.24, d]} color="#546065" metal={.35}/>
      <ArtBox position={[-w * .4, .58 + (tier >= 4 ? .35 : 0), 0]} size={[w * .22, tier >= 4 ? 1.8 : 1.16, d * (tier >= 2 ? .94 : .78)]} color="#3a484d"/>
      <ArtBox position={[-w * .4, tier >= 4 ? 1.86 : 1.22, 0]} size={[w * .25, .12, d * (tier >= 2 ? .98 : .82)]} color="#252e34" metal={.65}/>
      {[-1, 1].map(side => <ArtBox key={side} position={[w * .1 + side * w * .195, h * 1.24 + .16, 0]} size={[w * .41, .14, d + .25]} rotation={[0, 0, side * -.2]} color="#2d383f" metal={.65}/>)}
      {Array.from({ length: 6 }, (_, i) => <ArtBox key={i} position={[w * .1, h * 1.24 + .34, -d / 2 + i * d / 5]} size={[w * .8, .025, .035]} color="#738086" metal={.6}/>)}
      {Array.from({ length: tier >= 3 ? 3 : 2 }, (_, i) => <Gate key={i} x={w * .1 + (i - (tier >= 3 ? 1 : .5)) * 1.35} z={d / 2 + .045} w={1.05} h={1.23} warm/>)}
      <ArtBox position={[w * .1, 1.62, d / 2 + .12]} size={[w * .7, .26, .11]} color="#262f33"/>
      <ArtBox position={[w * .1, 1.61, d / 2 + .185]} size={[w * .58, .075, .025]} color={accent} glow={.55}/>
      <Vent x={w * .18} y={h * 1.24 + .34} z={-.65}/>
      {tier >= 2 && <><ArtBox position={[-w * .4, .7, d * .47 + .02]} size={[w * .18, 1.2, .06]} color="#31434a"/><Vent x={-w * .4} y={tier >= 4 ? 1.93 : 1.29} z={-.35}/></>}
      {tier >= 3 && <Vent x={w * .33} y={h * 1.24 + .34} z={.5} large/>}
      {tier >= 4 && <ArtBox position={[-w * .4, 1.35, d * .48]} size={[w * .15, .4, .06]} color="#997b59" glow={.25}/>}
      {tier >= 5 && <>{[-.6, .6].map(z => <ArtBox key={z} position={[w * .1, h * 1.24 + .39, z]} size={[1.6, .08, .55]} color="#5a8d97" metal={.5}/>)}<ArtBox position={[w * .45, .5, d / 2 + .3]} size={[.15, .9, .2]} color="#b6733c" glow={.3}/></>}
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
      <ArtBox position={[-w * .12, h * .5, d / 2 + .04]} size={[w * .72, h * .72, .09]} color="#39666e" metal={.5} glow={.16}/>
      {[-.35, -.1, .15].map(x => <ArtBox key={x} position={[x * w, h * .5, d / 2 + .1]} size={[.05, h * .76, .04]} color="#9aaeb0"/>)}
      <ArtBox position={[w * .42, h * .48, d / 2 + .11]} size={[.045, h * .75, .05]} color={accent} glow={.55}/><Vent x={-w * .25} y={h + .2} z={-.5} large/>
      <ArtBox position={[w * .2, h + .45, -.35]} size={[.7, .6, .7]} color="#899a9d"/><ArtBox position={[w * .2, h + 1.13, -.35]} size={[.035, .8, .035]} color="#b3c2c1" metal={.6}/><ArtBox position={[w * .2, h + 1.4, -.35]} size={[.65, .04, .035]} color="#8da4a8"/>
      <ArtBox position={[w * .34, .6, d / 2 + .12]} size={[.45, 1.1, .07]} color="#263b42"/><ArtBox position={[w * .34, 1.25, d / 2 + .16]} size={[.55, .07, .16]} color={accent} glow={.45}/>
      {tier >= 2 && <Vent x={w * .31} y={h + .2} z={.65} large/>}{tier >= 3 && <ArtBox position={[-w * .3, h + .43, .6]} size={[1.2, .5, .65]} color="#4a929b"/>}
      <pointLight position={[w * .4, 1, d / 2 + .45]} color="#80d7d2" intensity={2} distance={3}/>
    </>}
    {id === "PERSONNEL" && <>
      <ArtBox position={[0, h / 2, 0]} size={[w, h, d]} color="#697572"/><ArtBox position={[0, h + .09, 0]} size={[w + .18, .18, d + .18]} color="#3c484c"/>
      <Windows w={w} d={d} h={h} rows={2}/><ArtBox position={[0, .55, d / 2 + .12]} size={[.55, 1, .08]} color="#283b41"/>
      <ArtBox position={[0, 1.18, d / 2 + .32]} size={[1.1, .09, .65]} color="#8b9796" metal={.6}/>
      {tier >= 2 && <Vent x={-.8} y={h + .2} z={-.3}/>} {tier >= 3 && <ArtBox position={[0, h + .42, 0]} size={[w * .6, .5, d * .5]} color="#4e6167"/>}
    </>}
    {id === "FINANCE" && <>
      <ArtBox position={[-w * .09, h / 2, 0]} size={[w * .74, h, d]} color="#68757e"/><ArtBox position={[w * .38, h * .43, 0]} size={[w * .23, h * .86, d * .9]} color="#374a53"/>
      <ArtBox position={[-w * .12, h * .55, d / 2 + .04]} size={[w * .3, h * .7, .08]} color="#516e7b" metal={.55}/>
      {Array.from({ length: 3 }, (_, i) => <ArtBox key={i} position={[-w * .12, .7 + i * .78, d / 2 + .1]} size={[w * .35, .07, .06]} color="#b0b8b8"/>)}
      <ArtBox position={[-w * .09, h + .07, 0]} size={[w * .78, .14, d + .12]} color="#27353d"/>
      <ArtBox position={[w * .3, .54, d / 2 + .03]} size={[.5, 1, .08]} color="#9b8e74" glow={.15}/>
      {tier >= 2 && <ArtBox position={[w * .37, h * .87, 0]} size={[w * .26, .18, d]} color="#94a4ab"/>}{tier >= 3 && <Vent x={-.7} y={h + .16} z={-.3}/>} 
    </>}
    {id === "BUSINESS_OFFICE" && <>
      <ArtBox position={[0, h / 2, -d * .12]} size={[w, h, d * .74]} color="#667073"/><ArtBox position={[0, h + .06, -d * .12]} size={[w + .16, .13, d * .8]} color="#33454a"/>
      <Windows w={w} d={d * .5} h={h}/><ArtBox position={[w * .16, .64, d * .36]} size={[w * .5, 1.2, d * .3]} color="#4f777d" metal={.5} glow={.12}/>
      <ArtBox position={[w * .16, 1.32, d * .41]} size={[w * .58, .12, d * .5]} color="#a29d8b" metal={.5}/><ArtBox position={[w * .16, .65, d * .52]} size={[.055, 1.3, .035]} color="#c1c7c1"/>
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
function Vehicle({ x, z, van = false }: { x: number; z: number; van?: boolean }) {
  return <group name={van ? "company-van" : "visitor-car"} position={[x, .14, z]}><ArtBox position={[0, .48, 0]} size={[van ? 1.65 : 1.45, van ? .72 : .4, .75]} color={van ? "#9aa49e" : "#57707c"} metal={.45}/><ArtBox position={[.3, .77, 0]} size={[.6, .28, .65]} color="#263e47"/><ArtBox position={[0, .52, .38]} size={[.6, .1, .02]} color="#c98143"/>{[-1, 1].flatMap(side => [-.5, .5].map(x => <mesh key={`${side}-${x}`} position={[x, .19, side * .4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.2, .2, .09, 12]}/><meshStandardMaterial color="#20272b"/></mesh>))}</group>;
}
export function CampusGround({ mobile }: { mobile: boolean }) {
  const grain = useMemo(() => { const pixels = new Uint8Array(64 * 64 * 4); for (let i = 0; i < 4096; i++) { const v = 211 + (((i * 73856093) ^ (i * 19349663)) >>> 0) % 14; pixels.set([v, v, v, 255], i * 4); } const texture = new DataTexture(pixels, 64, 64, RGBAFormat); texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(9, 6); texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true; return texture; }, []);
  useEffect(() => () => grain.dispose(), [grain]);
  return <group name="industrial-campus-ground">
    <ArtBox position={[0, -.2, 0]} size={[29, .5, 18]} color="#353d40"/>
    <mesh position={[0, .065, 0]} receiveShadow><boxGeometry args={[26.7, .05, 15.3]}/><meshStandardMaterial color="#677171" map={grain} roughness={.95}/></mesh>
    <ArtBox position={[0, .1, 7.6]} size={[29, .04, 1.5]} color="#282f33"/>
    {Array.from({ length: 15 }, (_, i) => <ArtBox key={i} position={[-13 + i * 1.8, .135, 7.6]} size={[.7, .025, .045]} color="#afb8b4"/>)}
    {Array.from({ length: 6 }, (_, i) => <ArtBox key={i} position={[-10.5 + i * 1.3, .14, 4.6]} size={[.035, .025, 1.65]} color="#959e99"/>)}
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
    <Vehicle x={-7.9} z={4.6}/><Vehicle x={1.6} z={3.1} van/>
    <Lamp x={-10.5} z={5.9}/><Lamp x={5} z={5.9}/>{!mobile && <><Lamp x={-4.5} z={-4.1}/><Pallet x={10.6} z={4.5}/><Pallet x={10.7} z={5.8} crates={false}/></>}
    {[-12.2, 11.8].map(x => <group key={x} position={[x, .15, -7.35]}><ArtBox position={[0, .08, 0]} size={[1.2, .15, 1]} color="#4b5850"/><mesh position={[0, .6, 0]} castShadow><cylinderGeometry args={[.07, .1, 1, 8]}/><meshStandardMaterial color="#5e5d4c"/></mesh><mesh position={[0, 1.3, 0]} castShadow><icosahedronGeometry args={[.7, 1]}/><meshStandardMaterial color="#4d6654"/></mesh></group>)}
    {[-2.2, 2.2].map(x => <ArtBox key={x} position={[x, .36, 1.95]} size={[.09, .6, .09]} color="#b5864e"/>)}
  </group>;
}
export function MapFounder({ character, onOpen, reduced }: { character: PlayerCharacter; onOpen: () => void; reduced: boolean }) {
  const walker = useRef<Group>(null), body = useRef<Group>(null), elapsed = useRef(0);
  const limbs = useRef<{ leftArm?: Object3D; rightArm?: Object3D; leftLeg?: Object3D; rightLeg?: Object3D }>({});
  useEffect(() => {
    const model = body.current; if (!model) return;
    limbs.current = { leftArm: model.getObjectByName("arm--1"), rightArm: model.getObjectByName("arm-1"), leftLeg: model.getObjectByName("trouser-leg--1")?.parent ?? undefined, rightLeg: model.getObjectByName("trouser-leg-1")?.parent ?? undefined };
    // Pivot the map instance's legs at the hips without changing the creator model.
    const legs = [limbs.current.leftLeg, limbs.current.rightLeg].filter((leg): leg is Object3D => !!leg);
    for (const leg of legs) { leg.position.y += 1.35; for (const child of leg.children) child.position.y -= 1.35; }
    return () => { for (const leg of legs) { leg.position.y -= 1.35; for (const child of leg.children) child.position.y += 1.35; } };
  }, []);
  useFrame((_, delta) => {
    if (!walker.current || !body.current) return;
    if (!reduced) elapsed.current += Math.min(delta, .05);
    const pose = getCampusWalkPose(reduced ? 0 : elapsed.current), stride = reduced ? 0 : pose.stride * .34;
    walker.current.position.x = pose.x;
    body.current.rotation.y = pose.direction * Math.PI / 2;
    body.current.position.y = .6 + Math.abs(stride) * .035;
    if (limbs.current.leftArm) limbs.current.leftArm.rotation.x = -stride;
    if (limbs.current.rightArm) limbs.current.rightArm.rotation.x = stride;
    if (limbs.current.leftLeg) limbs.current.leftLeg.rotation.x = stride;
    if (limbs.current.rightLeg) limbs.current.rightLeg.rotation.x = -stride;
  });
  const a = getFounderAppearance(character);
  return <group ref={walker} name="campus-founder" position={[0, .125, 7.6]} onClick={event => { event.stopPropagation(); if (event.delta < 5) onOpen(); }}>
    <mesh position={[0, .008, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.3, 24]}/><meshBasicMaterial color="#141b1e" transparent opacity={.5}/></mesh>
    <group ref={body} position={[0, .6, 0]} scale={.37}><FounderAvatar a={a} reduced/></group>
  </group>;
}
