"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { FounderModel3D } from "@/components/founder-model-3d";
import type { EquippedCharacterCosmetics } from "@/game/types";
import type { CharacterModelId } from "@/game/data/character-models";
// Retained only for legacy save migration and the map's lightweight representation.
export interface Character3DAppearance { presentation: "MALE" | "FEMALE"; height: number; build: number; shoulders: number; arms: number; chest: number; torso: number; waist: number; hips: number; legs: number; skinTone: string; headShape: string; eyeShape: string; eyeColor: string; eyebrows: string; nose: string; mouth: string; hair: string; hairColor: string; outfit: string }
export function FounderAvatar({ a }: { a: Character3DAppearance; reduced: boolean; cosmetics?: EquippedCharacterCosmetics }) { return <FounderModel3D modelId={a.presentation === "MALE" ? "founder_male_01" : "founder_female_01"}/>; }
function CameraFraming({ resetKey }: { resetKey: number }) {
  const { camera, size } = useThree();
  useEffect(() => { const distance = Math.max(size.height < 600 ? 7.5 : 6.6, 3.4 / (size.width / size.height)); camera.position.set(0, .15, distance); camera.lookAt(0, .05, 0); camera.updateProjectionMatrix(); }, [camera, size.width, size.height, resetKey]); return null;
}
export function Character3D({ modelId, quality = "AUTO", resetKey = 0, motion = "AUTO" }: { modelId: CharacterModelId; quality?: "AUTO" | "LOW" | "MEDIUM" | "HIGH"; resetKey?: number; motion?: "AUTO" | "FULL" | "REDUCED" }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  return <Canvas aria-label="Drehbare 3D-Vorschau des Charakters" gl={{ preserveDrawingBuffer: true, antialias: quality !== "LOW" }} shadows={quality !== "LOW"} dpr={quality === "HIGH" ? [1, 2] : [1, 1.4]} camera={{ position: [0, .15, 6.6], fov: 37 }}>
    <color attach="background" args={["#0b1215"]}/><hemisphereLight args={["#ffffff", "#354749", 1.6]}/><directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffe0c3" castShadow/><directionalLight position={[-4, 3, 3]} intensity={1.4} color="#a8e3dc"/><pointLight position={[0, 3, -3]} intensity={3} color="#ef7c3b"/>
    <CameraFraming resetKey={resetKey}/><FounderModel3D modelId={modelId} reduced={motion === "REDUCED" || (motion === "AUTO" && reduced)}/><ContactShadows position={[0, -1.62, 0]} opacity={.55} scale={5} blur={2}/><OrbitControls key={resetKey} target={[0, .05, 0]} enablePan={false} minDistance={3.3} maxDistance={20} minPolarAngle={Math.PI * .27} maxPolarAngle={Math.PI * .62}/>
  </Canvas>;
}
