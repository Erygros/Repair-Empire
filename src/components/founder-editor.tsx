"use client";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { CHARACTER_MODELS, CHARACTER_MODEL_IDS, type CharacterModelId } from "@/game/data/character-models";
import "./founder-editor.css";
export function FounderEditor({ modelId, name, onChange, onName }: { modelId: CharacterModelId | null; name: string; onChange: (id: CharacterModelId) => void; onName: (name: string) => void }) {
  return <div className="founder-editor creator-controls"><label>CEO Name<input value={name} maxLength={24} onChange={event => onName(event.target.value)}/></label><div className="founder-model-selection" role="group" aria-label="Character-Modell">{CHARACTER_MODEL_IDS.map(id => <button type="button" key={id} aria-pressed={modelId === id} onClick={() => onChange(id)}><Image unoptimized src={CHARACTER_MODELS[id].thumbnail} width={320} height={420} alt={CHARACTER_MODELS[id].label}/><strong>{CHARACTER_MODELS[id].label}</strong></button>)}</div></div>;
}
export function FounderEditorTools({ onResetView }: { onResetView: () => void }) { return <div className="founder-editor-tools"><button type="button" title="Ansicht zurücksetzen" aria-label="Ansicht zurücksetzen" onClick={onResetView}><RotateCcw size={18}/></button></div>; }
