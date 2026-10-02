"use client";

import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { DataTexture, DoubleSide, InstancedMesh, Object3D, RepeatWrapping, RGBAFormat, Shape, SRGBColorSpace } from "three";

type Point = [number, number, number];
function Part({ position, size, color, metal = .25, rotation = [0, 0, 0], glow = 0 }: { position: Point; size: Point; color: string; metal?: number; rotation?: Point; glow?: number }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={.65} emissive={color} emissiveIntensity={glow}/></mesh>;
}

export function Glazing({ width, height, lit = false }: { width: number; height: number; lit?: boolean }) {
  return <group>
    <Part position={[0, 0, 0]} size={[width + .09, height + .09, .08]} color="#273438"/>
    <mesh position={[0, 0, .047]}><planeGeometry args={[width, height]}/><meshPhysicalMaterial color={lit ? "#758580" : "#486c7a"} roughness={.14} metalness={.35} clearcoat={1} emissive="#e1b87c" emissiveIntensity={lit ? .12 : 0}/></mesh>
    {[-1, 1].map(side => <group key={side}><Part position={[side * width / 2, 0, .065]} size={[.035, height, .04]} color="#afb9b7" metal={.75}/><Part position={[0, side * height / 2, .065]} size={[width + .05, .035, .04]} color="#afb9b7" metal={.75}/></group>)}
    <Part position={[0, 0, .075]} size={[.025, height, .03]} color="#707d80" metal={.7}/>
    <Part position={[0, -height / 2 - .055, .09]} size={[width + .15, .045, .18]} color="#a7aaa3"/>
    <Part position={[-width * .21, height * .06, .053]} size={[width * .12, height * .8, .004]} color="#90adb3" rotation={[0, 0, -.22]}/>
  </group>;
}

export function Entrance({ x, z, width = .55 }: { x: number; z: number; width?: number }) {
  return <group position={[x, .64, z]} name="framed-building-entrance">
    <Part position={[0, 0, 0]} size={[width + .13, 1.16, .12]} color="#b1b9b5" metal={.6}/>
    <Part position={[0, -.02, .071]} size={[width, 1.05, .04]} color="#27363d"/>
    <group position={[0, .15, .098]}><Glazing width={width - .12} height={.53}/></group>
    <Part position={[width * .33, -.12, .135]} size={[.025, .2, .035]} color="#d1d5d0" metal={.85}/>
    <Part position={[0, -.59, .13]} size={[width + .23, .08, .35]} color="#8b9290"/>
    <Part position={[0, .66, .12]} size={[width + .25, .065, .2]} color="#303a3c"/>
    <Part position={[0, .62, .15]} size={[width * .8, .025, .13]} color="#ffe1a6" glow={1.5}/>
  </group>;
}

export function HallRoof({ w, d, y, x }: { w: number; d: number; y: number; x: number }) {
  const slope = .2, half = w * .41, peak = y + Math.sin(slope) * half / 2 + .16;
  const gable = useMemo(() => new Shape().moveTo(-w * .39, y).lineTo(0, peak).lineTo(w * .39, y).closePath(), [w, y, peak]);
  return <group position={[x, 0, 0]} name="standing-seam-hall-roof">
    {[-1, 1].map(side => <mesh key={`gable-${side}`} position={[0, 0, side * d / 2]} castShadow><shapeGeometry args={[gable]}/><meshStandardMaterial color="#687470" roughness={.85} side={DoubleSide}/></mesh>)}
    {[-1, 1].map(side => <group key={side} position={[side * Math.cos(slope) * half / 2, peak - Math.sin(slope) * half / 2, 0]} rotation={[0, 0, -side * slope]}>
      <Part position={[0, 0, 0]} size={[half, .09, d + .3]} color="#465153" metal={.7}/>
      {Array.from({ length: 12 }, (_, i) => <Part key={i} position={[0, .056, -(d + .3) / 2 + i * (d + .3) / 11]} size={[half, .025, .025]} color="#6d7776" metal={.8}/>)}
      <group position={[0, .09, -.35]} rotation={[-Math.PI / 2, 0, 0]}><Glazing width={half * .65} height={.65}/></group>
    </group>)}
    <Part position={[0, peak + .045, 0]} size={[.13, .075, d + .38]} color="#86908b" metal={.8}/>
    {[-1, 1].map(side => <group key={side}>
      <Part position={[side * half * Math.cos(slope), y + .04, 0]} size={[.12, .12, d + .4]} color="#88918a" metal={.75}/>
      <Part position={[side * half * Math.cos(slope), y / 2, -d * .45]} size={[.065, y, .065]} color="#818b85" metal={.7}/>
    </group>)}
    <group position={[w * .23, y + .08, -d * .32]}>
      <Part position={[0, .4, 0]} size={[.23, .8, .23]} color="#87938f" metal={.65}/>
      <Part position={[0, .82, 0]} size={[.39, .08, .39]} color="#bdc4ba" metal={.7}/>
      <Part position={[0, .73, .125]} size={[.17, .065, .025]} color="#263230"/>
    </group>
  </group>;
}

export function DetailedVehicle({ x, z, van = false }: { x: number; z: number; van?: boolean }) {
  const paint = van ? "#dadfd7" : "#426b7b", length = van ? 2.5 : 2.25;
  return <group name={van ? "company-van" : "visitor-car"} position={[x, .12, z]}>
    <RoundedBox args={[length, .36, .94]} radius={.1} smoothness={3} position={[0, .39, 0]} castShadow><meshPhysicalMaterial color={paint} metalness={.55} roughness={.28} clearcoat={1}/></RoundedBox>
    <RoundedBox args={[van ? 1.6 : 1.22, van ? .6 : .38, .83]} radius={.08} smoothness={3} position={[van ? -.3 : -.13, van ? .81 : .7, 0]} castShadow><meshPhysicalMaterial color={paint} metalness={.45} roughness={.3} clearcoat={1}/></RoundedBox>
    {[-1, 1].map(side => <group key={side}>
      <Part position={[van ? .3 : .04, van ? .85 : .73, side * .425]} size={[van ? .43 : .86, van ? .35 : .26, .016]} color="#3d5864" metal={.65}/>
      <Part position={[van ? .27 : .06, van ? .85 : .73, side * .443]} size={[.035, van ? .38 : .29, .024]} color={paint}/>
      <Part position={[.64, .73, side * .53]} size={[.15, .09, .14]} color={paint}/>
      <Part position={[-.22, .49, side * .478]} size={[.14, .025, .025]} color="#bbc4c4" metal={.8}/>
      <Part position={[0, .28, side * .48]} size={[length * .78, .055, .035]} color="#303738"/>
      {[-.75, .75].map(axle => <group key={axle} position={[axle, .22, side * .47]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow><cylinderGeometry args={[.23, .23, .14, 24]}/><meshStandardMaterial color="#202624" roughness={.95}/></mesh>
        <mesh position={[0, side * .078, 0]}><cylinderGeometry args={[.14, .14, .02, 16]}/><meshStandardMaterial color="#b0b7b3" metalness={.8} roughness={.3}/></mesh>
        <mesh position={[0, side * .091, 0]}><cylinderGeometry args={[.06, .06, .025, 12]}/><meshStandardMaterial color="#434c4d" metalness={.7}/></mesh>
      </group>)}
      <Part position={[length / 2 + .005, .43, side * .32]} size={[.035, .11, .19]} color="#ffedbf" glow={.65}/>
      <Part position={[-length / 2 - .005, .43, side * .32]} size={[.035, .13, .16]} color="#a73329" glow={.25}/>
      {van && <Part position={[-.45, .65, side * .475]} size={[1.35, .09, .02]} color="#db813d"/>}
    </group>)}
    <Part position={[van ? .55 : .52, van ? .85 : .73, 0]} size={[.025, van ? .36 : .27, .72]} color="#547580" rotation={[0, 0, -.22]}/>
    <Part position={[length / 2 + .025, .3, 0]} size={[.04, .12, .42]} color="#293432"/>
    <Part position={[length / 2 + .05, .26, 0]} size={[.02, .06, .2]} color="#e4e6d9"/>
    <Part position={[-length / 2 - .025, .25, 0]} size={[.04, .075, .75]} color="#3d4646"/>
  </group>;
}

export function GrassBed({ x, z, width, depth }: { x: number; z: number; width: number; depth: number }) {
  const blades = useRef<InstancedMesh>(null);
  useEffect(() => {
    if (!blades.current) return;
    const dummy = new Object3D();
    for (let i = 0; i < 160; i++) {
      const a = ((i * 73 + 17) % 163) / 163, b = ((i * 47 + 29) % 167) / 167;
      dummy.position.set((a - .5) * width, .1, (b - .5) * depth);
      dummy.rotation.set(.1, i * 2.4, (a - .5) * .4); dummy.scale.set(1, .5 + b, 1); dummy.updateMatrix(); blades.current.setMatrixAt(i, dummy.matrix);
    }
    blades.current.instanceMatrix.needsUpdate = true;
  }, [width, depth]);
  return <group position={[x, .12, z]} name="campus-grass-bed">
    <Part position={[0, 0, 0]} size={[width, .08, depth]} color="#53654b" metal={0}/>
    <instancedMesh ref={blades} args={[undefined, undefined, 160]} castShadow><coneGeometry args={[.035, .18, 3]}/><meshStandardMaterial color="#6d8056" roughness={1}/></instancedMesh>
    {[-1, 1].map(side => <Part key={side} position={[0, .015, side * depth / 2]} size={[width + .12, .1, .06]} color="#8a9083"/>)}
  </group>;
}

export function RoofEdges({ w, d, y, x = 0, z = 0 }: { w: number; d: number; y: number; x?: number; z?: number }) {
  return <group position={[x, y, z]} name="flat-roof-flashing">
    {[-1, 1].map(side => <group key={side}>
      <Part position={[side * w / 2, 0, 0]} size={[.055, .055, d + .12]} color="#82908b" metal={.7}/>
      <Part position={[0, 0, side * d / 2]} size={[w + .12, .055, .055]} color="#82908b" metal={.7}/>
    </group>)}
    <Part position={[w / 2 + .015, -y / 2, -d * .4]} size={[.055, y, .055]} color="#6c7b77" metal={.6}/>
    <Part position={[-w * .3, .015, 0]} size={[.025, .015, d * .9]} color="#62716f"/>
  </group>;
}

export function CampusTree({ x }: { x: number }) {
  return <group position={[x, .15, -7.35]} name="campus-tree">
    <Part position={[0, .04, 0]} size={[.8, .07, .7]} color="#535c43" metal={0}/>
    <mesh position={[0, .65, 0]} castShadow><cylinderGeometry args={[.045, .1, 1.2, 12]}/><meshStandardMaterial color="#70614c" roughness={1}/></mesh>
    {Array.from({ length: 9 }, (_, i) => {
      const angle = i * 2.4, radius = i % 3 === 0 ? .12 : .32;
      return <group key={i} position={[Math.cos(angle) * radius, 1.3 + (i % 3) * .2, Math.sin(angle) * radius]}>
        <mesh rotation={[0, angle, .5]} castShadow><cylinderGeometry args={[.02, .045, .45, 6]}/><meshStandardMaterial color="#70614c"/></mesh>
        <mesh scale={[.45, .4 + (i % 2) * .13, .38]} castShadow><sphereGeometry args={[1, 12, 10]}/><meshStandardMaterial color={i % 2 ? "#58774e" : "#718761"} roughness={1}/></mesh>
      </group>;
    })}
  </group>;
}

export function Asphalt({ road = false }: { road?: boolean }) {
  const grain = useMemo(() => {
    const pixels = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < 128 * 128; i++) { const v = 200 + (((i * 73856093) ^ (i * 19349663)) >>> 0) % 24; pixels.set([v, v, v, 255], i * 4); }
    const texture = new DataTexture(pixels, 128, 128, RGBAFormat); texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(road ? 16 : 12, road ? 2 : 8); texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true; return texture;
  }, [road]);
  useEffect(() => () => grain.dispose(), [grain]);
  return <mesh position={road ? [0, .1, 7.6] : [0, .065, 0]} receiveShadow><boxGeometry args={road ? [29, .04, 1.5] : [26.7, .05, 15.3]}/><meshStandardMaterial color={road ? "#535857" : "#8b9290"} map={grain} bumpMap={grain} bumpScale={.018} roughness={.96}/></mesh>;
}
