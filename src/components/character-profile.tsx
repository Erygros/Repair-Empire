"use client";
import { RepairEmpireIcon } from "@/components/repair-icons";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Character3D } from "@/components/character-3d";
import { FounderEditorTools } from "@/components/founder-editor";
import { CHARACTER_MODELS, resolveCharacterModel } from "@/game/data/character-models";
import { FOUNDER_SKILLS } from "@/game/data/founder-skills";
import type { GameState } from "@/game/types";
import "./department-scenes.css";
export function CharacterProfile({ state, onBack, onSave, onDirtyChange, motion }: { state: GameState; onBack: () => void; onSave: (name: string) => void; onDirtyChange: (dirty: boolean) => void; motion: "AUTO" | "FULL" | "REDUCED" }) {
  const character = state.playerCharacter!, modelId = resolveCharacterModel(character);
  const [name, setName] = useState(character.displayName), [reset, setReset] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const dirty = name.trim() !== character.displayName;
  useEffect(() => { onDirtyChange(dirty || busy); return () => onDirtyChange(false); }, [dirty, busy, onDirtyChange]);
  useEffect(() => { if (!dirty) return; const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; }; window.addEventListener("beforeunload", prevent); return () => window.removeEventListener("beforeunload", prevent); }, [dirty]);
  async function save() {
    if (busy || name.trim().length < 2) return; setBusy(true); setError("");
    try { const response = await fetch("/api/character", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ceoName: name.trim() }) }); if (!response.ok) throw Error("Founder konnte nicht gespeichert werden."); onSave(name.trim()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen."); } finally { setBusy(false); }
  }
  return <section className="founder-studio"><header className="founder-studio-header"><button aria-label="Zur Firmenkarte" title="Zur Firmenkarte" onClick={onBack}><ArrowLeft size={18}/></button><div><p className="panel-label">FOUNDER STUDIO</p><h2>{character.displayName}</h2></div><button className="founder-save" disabled={!dirty || busy || name.trim().length < 2} onClick={save}><Save size={16}/>{busy ? "Speichert…" : "Speichern"}</button></header><div className="founder-studio-layout"><div className="founder-editor creator-controls"><label>CEO Name<input value={name} maxLength={24} onChange={event => setName(event.target.value)}/></label><h3>{CHARACTER_MODELS[modelId].source}</h3><p>Founder-Identität · dauerhaft</p></div><section className="founder-studio-stage"><Character3D modelId={modelId} resetKey={reset} motion={motion}/><FounderEditorTools onResetView={() => setReset(value => value + 1)}/></section><aside className="founder-wardrobe">{character.founderSkill && <div className="founder-skill"><RepairEmpireIcon category="skills" name={character.founderSkill.toLowerCase()} size="lg"/><strong>{FOUNDER_SKILLS[character.founderSkill].name}</strong><p>{FOUNDER_SKILLS[character.founderSkill].bonus}</p><small>Founder Skill · dauerhaft</small></div>}{error && <p role="alert" className="auth-error">{error}</p>}</aside></div></section>;
}
