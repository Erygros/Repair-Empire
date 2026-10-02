"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

export interface Character3DAppearance { presentation: "MALE" | "FEMALE"; height: number; build: number; shoulders: number; arms: number; chest: number; torso: number; waist: number; hips: number; legs: number; skinTone: string; headShape: string; eyeShape: string; eyeColor: string; eyebrows: string; nose: string; mouth: string; hair: string; hairColor: string; outfit: string }
const SKINS: Record<string, string> = { PORCELAIN: "#f2c9ad", WARM: "#d89a71", MEDIUM: "#aa6f4d", DEEP: "#70462f", DARK: "#432a22" };
const HAIR: Record<string, string> = { BLACK: "#161719", BROWN: "#4b2f24", COPPER: "#8f4028", BLONDE: "#c7a26c", SILVER: "#a7aeb0" };
const EYES: Record<string, string> = { BROWN: "#70412a", DARK_BROWN: "#32231d", BLUE: "#328fcb", GREEN: "#45865b", GREY: "#879b9f", HAZEL: "#a48c43" };
type Point = [number, number, number];
function Part({ name, position, scale, color, rotation = [0, 0, 0] }: { name: string; position: Point; scale: Point; color: string; rotation?: Point }) {
  return <mesh name={name} position={position} scale={scale} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1, 32, 24]}/><meshStandardMaterial color={color} roughness={.75}/></mesh>;
}
function Limb({ name, position, radius, length, color }: { name: string; position: Point; radius: number; length: number; color: string }) {
  return <mesh name={name} position={position} castShadow receiveShadow><capsuleGeometry args={[radius, length, 8, 20]}/><meshStandardMaterial color={color} roughness={.85}/></mesh>;
}
function Avatar({ a, reduced }: { a: Character3DAppearance; reduced: boolean }) {
  const root = useRef<Group>(null);
  useFrame(({ clock }) => { if (root.current) root.current.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * .65) * .025; });
  const skin = SKINS[a.skinTone] ?? SKINS.WARM, hair = HAIR[a.hairColor] ?? HAIR.BROWN;
  const jacket = a.outfit === "DARK" ? "#273b42" : a.outfit === "BASIC" ? "#426166" : "#f17e32";
  const shoulder = .36 + a.shoulders * .0015, torso = .9 + a.torso * .002;
  const shoulderY = 1.42 + torso * .84, neckY = 1.42 + torso;
  const headWidth = a.headShape === "WIDE" ? .39 : a.headShape === "NARROW" ? .29 : a.headShape === "ROUND" ? .37 : a.headShape === "ANGULAR" ? .35 : .34;
  const eyeHeight = a.eyeShape === "ROUND" ? .052 : a.eyeShape === "FOCUSED" ? .03 : .039;
  const noseWidth = a.nose === "WIDE" ? .072 : a.nose === "NARROW" ? .039 : .052;
  const lips = a.mouth === "SOFT" ? .026 : a.mouth === "FIRM" ? .012 : .018;
  return <group ref={root} name="founder-avatar" position={[0, -1.62, 0]} scale={[.88 + a.build * .0024, .93 + a.height * .002, .88 + a.build * .0024]}>
    <group name="head" position={[0, neckY + .56, 0]}>
      <Part name="face" position={[0, 0, 0]} scale={[headWidth, a.headShape === "ROUND" ? .36 : .41, .31]} color={skin}/>
      <Part name="jaw" position={[0, -.23, .015]} scale={[headWidth * (a.headShape === "ANGULAR" ? .87 : .74), .15, .235]} color={skin}/>
      {[-1, 1].map(side => <group key={side}>
        <Part name={`ear-${side}`} position={[side * headWidth, -.005, 0]} scale={[.068, .107, .058]} color={skin}/>
        <Part name={`inner-ear-${side}`} position={[side * (headWidth + .025), -.005, .044]} scale={[.031, .068, .016]} color="#a36350"/>
        <Part name={`eye-white-${side}`} position={[side * .13, .055, .285]} scale={[.083, eyeHeight, .035]} color="#f8f3e8"/>
        <Part name={`iris-${side}`} position={[side * .13, .055, .317]} scale={[.028, eyeHeight * .82, .012]} color={EYES[a.eyeColor] ?? EYES.BROWN}/>
        <Part name={`pupil-${side}`} position={[side * .13, .055, .328]} scale={[.013, eyeHeight * .62, .006]} color="#101719"/>
        <Part name={`eye-highlight-${side}`} position={[side * .13 - .007, .066, .334]} scale={[.006, .007, .004]} color="#ffffff"/>
        <Part name={`eyebrow-${side}`} position={[side * .13, .139, .292]} scale={[.09, a.eyebrows === "BOLD" ? .023 : a.eyebrows === "FINE" ? .01 : .016, .019]} rotation={[0, 0, a.eyebrows === "CURVED" ? side * .18 : a.eyeShape === "FOCUSED" ? side * .13 : 0]} color={hair}/>
      </group>)}
      <Part name="nose-bridge" position={[0, -.012, .306]} scale={[noseWidth * .7, .1, .065]} color={skin}/>
      <Part name="nose-tip" position={[0, -.075, .362]} scale={[noseWidth, .046, .047]} color={skin}/>
      {[-1, 1].map(side => <Part key={side} name={`nostril-${side}`} position={[side * noseWidth * .58, -.098, .378]} scale={[.011, .006, .008]} color="#633e34"/>)}
      <Part name="upper-lip" position={[0, -.17, .294]} scale={[.092, lips, .019]} color="#9a5749"/>
      <Part name="lower-lip" position={[0, -.19, .291]} scale={[.086, lips * .85, .018]} color="#be7964"/>
      <Part name="mouth-line" position={[0, -.18, .312]} scale={[.079, .004, .005]} color="#653b32"/>
      <mesh name="hair-cap" position={[0, .03, -.025]} scale={[headWidth + .015, .405, .325]} castShadow><sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, a.hair === "BUZZ" ? .95 : 1.18]}/><meshStandardMaterial color={hair} roughness={.95}/></mesh>
      {a.hair !== "BUZZ" && <Part name="fringe" position={[a.hair === "SIDE" ? -.09 : 0, .255, .19]} scale={[headWidth * .94, a.hair === "SLICK" ? .075 : .13, .16]} rotation={[0, 0, a.hair === "SIDE" ? -.22 : 0]} color={hair}/>}
      {["MEDIUM", "LONG", "CURLY"].includes(a.hair) && <Part name="back-hair" position={[0, a.hair === "LONG" ? -.24 : -.07, -.22]} scale={[headWidth * 1.06, a.hair === "LONG" ? .53 : .34, .15]} color={hair}/>}
      {a.hair === "CURLY" && [-2, -1, 0, 1, 2].map(i => <Part key={i} name={`curl-${i}`} position={[i * .115, .32 + (2 - Math.abs(i)) * .025, .1]} scale={[.11, .12, .16]} color={hair}/>)}
    </group>
    <Limb name="neck" position={[0, neckY + .14, 0]} radius={.115} length={.25} color={skin}/>
    <mesh name="jacket-torso" position={[0, 1.42 + torso / 2, 0]} scale={[1, 1, .72]} castShadow receiveShadow><cylinderGeometry args={[shoulder * (a.presentation === "MALE" ? 1.1 : 1), .28 + a.waist * .001, torso, 32]}/><meshStandardMaterial color={jacket} roughness={.88}/></mesh>
    <Part name="jacket-chest" position={[0, shoulderY - .19, .015]} scale={[shoulder, .28, .22 + a.chest * .0006]} color={jacket}/>
    <mesh name="zipper" position={[0, 1.42 + torso / 2, .273]}><boxGeometry args={[.018, torso * .88, .014]}/><meshStandardMaterial color="#d3dad3" metalness={.55} roughness={.4}/></mesh>
    {[-1, 1].map(side => <group key={side}>
      <Part name={`collar-${side}`} position={[side * .115, neckY - .018, .12]} scale={[.1, .07, .12]} rotation={[0, 0, side * -.3]} color="#26383b"/>
      <RoundedBox name={`jacket-pocket-${side}`} args={[.14, .15, .028]} radius={.012} position={[side * .21, shoulderY - .28, .274]}><meshStandardMaterial color={jacket}/></RoundedBox>
      {/* Every arm is anchored at its shoulder, including when proportions change. */}
      <group name={`arm-${side}`} position={[side * shoulder, shoulderY, 0]} rotation={[0, 0, side * .12]} scale={[1, .9 + a.arms * .002, 1]}>
        <Part name={`shoulder-${side}`} position={[side * .025, 0, 0]} scale={[.18, .18, .19]} color={jacket}/>
        <Limb name={`sleeve-${side}`} position={[0, -.23, 0]} radius={.135} length={.32} color={jacket}/>
        <Limb name={`forearm-${side}`} position={[0, -.58, .015]} radius={.092} length={.3} color={skin}/>
        <Limb name={`cuff-${side}`} position={[0, -.435, .01]} radius={.115} length={.035} color="#293d40"/>
        <Part name={`hand-${side}`} position={[0, -.84, .02]} scale={[.1, .14, .065]} color={skin}/>
        <Part name={`thumb-${side}`} position={[-side * .077, -.8, .045]} scale={[.043, .083, .038]} rotation={[0, 0, side * -.35]} color={skin}/>
      </group>
    </group>)}
    <Part name="trouser-hips" position={[0, 1.35, 0]} scale={[.32 + a.hips * .001, .25, .245]} color="#354345"/>
    <mesh name="belt" position={[0, 1.47, 0]} scale={[1, 1, .72]}><cylinderGeometry args={[.29 + a.waist * .001, .29 + a.waist * .001, .075, 32]}/><meshStandardMaterial color="#192629"/></mesh>
    <RoundedBox name="belt-buckle" args={[.09, .06, .03]} radius={.008} position={[0, 1.47, .25]}><meshStandardMaterial color="#a8b7b6" metalness={.65} roughness={.4}/></RoundedBox>
    {[-1, 1].map(side => <group key={side} position={[side * (.17 + a.hips * .0007), 0, 0]}>
      <Limb name={`trouser-leg-${side}`} position={[0, .78, 0]} radius={.135 + a.legs * .0006} length={.83} color="#354345"/>
      <Part name={`knee-pad-${side}`} position={[0, .72, .14]} scale={[.115, .145, .047]} color="#202f32"/>
      <Limb name={`boot-shaft-${side}`} position={[0, .27, 0]} radius={.145} length={.16} color="#263033"/>
      <RoundedBox name={`shoe-${side}`} args={[.31, .22, .49]} radius={.07} position={[0, .14, .1]} castShadow><meshStandardMaterial color="#263033" roughness={.8}/></RoundedBox>
      <RoundedBox name={`sole-${side}`} args={[.325, .07, .51]} radius={.025} position={[0, .045, .1]}><meshStandardMaterial color="#101b1d"/></RoundedBox>
      {[0, 1, 2].map(i => <mesh key={i} name={`lace-${side}-${i}`} position={[0, .254, .08 + i * .055]}><boxGeometry args={[.16, .009, .012]}/><meshStandardMaterial color="#9daca9"/></mesh>)}
    </group>)}
  </group>;
}
function CameraFraming({ resetKey }: { resetKey: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    // Keep the complete body in frame even in a narrow, tall editor column.
    const distance = Math.max(7.2, 3.4 / (size.width / size.height));
    camera.position.set(0, .35, distance);
    camera.lookAt(0, .15, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, resetKey]);
  return null;
}
export function Character3D({ appearance, quality = "AUTO", resetKey = 0 }: { appearance: Character3DAppearance; quality?: "AUTO" | "LOW" | "MEDIUM" | "HIGH"; resetKey?: number }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  return <Canvas aria-label="Drehbare 3D-Vorschau des Charakters" gl={{ preserveDrawingBuffer: true, antialias: quality !== "LOW" }} shadows={quality !== "LOW"} dpr={quality === "HIGH" ? [1, 2] : [1, 1.4]} camera={{ position: [0, .35, 6.5], fov: 37 }}>
    <color attach="background" args={["#0b1215"]}/><ambientLight intensity={.9}/><directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffe0c3" castShadow/><directionalLight position={[-4, 3, 3]} intensity={1.4} color="#a8e3dc"/><pointLight position={[0, 3, -3]} intensity={2} color="#ef7c3b"/>
    <CameraFraming resetKey={resetKey}/><Avatar a={appearance} reduced={reduced}/><ContactShadows position={[0, -1.62, 0]} opacity={.55} scale={5} blur={2}/><OrbitControls key={resetKey} target={[0, .15, 0]} enablePan={false} minDistance={3.3} maxDistance={20} minPolarAngle={Math.PI * .27} maxPolarAngle={Math.PI * .62}/>
  </Canvas>;
}
