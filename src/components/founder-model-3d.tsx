"use client";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { AnimationMixer, Mesh, SkinnedMesh } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CHARACTER_MODELS, type CharacterModelId } from "@/game/data/character-models";
function ModelStatus({ failed = false }: { failed?: boolean }) {
  const canvas = useThree(state => state.gl.domElement);
  useEffect(() => {
    const status = document.createElement("p");
    status.className = "model-status"; status.setAttribute("role", failed ? "alert" : "status");
    status.textContent = failed ? "Character-Modell nicht verfügbar. Bitte erneut laden." : "Character wird geladen.";
    Object.assign(status.style, { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: "2" });
    canvas.parentElement?.append(status);
    return () => status.remove();
  }, [canvas, failed]);
  return null;
}
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ModelStatus failed/> : this.props.children; }
}
function Rig({ modelId }: { modelId: CharacterModelId }) {
  const config = CHARACTER_MODELS[modelId];
  const loaded = useGLTF(config.path);
  const instance = useMemo(() => { const model = clone(loaded.scene); model.traverse(object => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false; } }); return model; }, [loaded.scene]);
  const mixer = useMemo(() => new AnimationMixer(instance), [instance]);
  useEffect(() => () => { instance.traverse(object => { if (object instanceof SkinnedMesh) object.skeleton.dispose(); }); }, [instance]);
  useEffect(() => {
    const desired = config.idle ?? config.walk;
    const clip = loaded.animations.find(item => item.name === desired) ?? loaded.animations[0];
    if (!clip) return;
    const action = mixer.clipAction(clip); action.reset().play();
    // Sample a neutral supplied pose without playing any character animation.
    action.time = modelId === "founder_male_01" ? .2 : 1; action.paused = true; mixer.update(0);
    return () => { action.stop(); mixer.stopAllAction(); mixer.uncacheRoot(instance); };
  }, [config, instance, loaded.animations, mixer, modelId]);
  const scale = 3.2 / config.height;
  // Normalize centimeter and meter assets into the existing actor footprint.
  return <group name="founder-avatar" scale={scale} position={[-config.center[0] * scale, -1.62 - config.floor * scale, -config.center[2] * scale]} dispose={null}><primitive object={instance} dispose={null}/></group>;
}
export function FounderModel3D({ modelId }: { modelId: CharacterModelId; reduced?: boolean }) { return <ModelBoundary key={modelId}><Suspense fallback={<ModelStatus/>}><Rig modelId={modelId}/></Suspense></ModelBoundary>; }
