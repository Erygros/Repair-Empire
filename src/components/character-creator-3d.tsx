"use client";
import { useState } from "react";
import { BrandLogo, RepairEmpireIcon } from "@/components/repair-icons";
import { useRouter } from "next/navigation";
import { Character3D } from "@/components/character-3d";
import { FounderEditor, FounderEditorTools } from "@/components/founder-editor";
import { CHARACTER_MODELS, type CharacterModelId } from "@/game/data/character-models";
import { FOUNDER_SKILLS, type FounderSkill } from "@/game/data/founder-skills";
export function CharacterCreator3D({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [modelId, setModelId] = useState<CharacterModelId | null>(null), [name, setName] = useState(initialName), [skill, setSkill] = useState<FounderSkill | null>(null), [reset, setReset] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function finish() {
    if (name.trim().length < 2 || !skill || !modelId || busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/character", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ceoName: name.trim(), characterModelId: modelId, founderSkill: skill }) });
      if (!response.ok) throw Error(response.status === 503 ? "Character-Service nicht verfügbar." : "Character konnte nicht gespeichert werden.");
      const saved = await response.json();
      try { localStorage.setItem("repair-empire-save-v1", JSON.stringify(saved.gameState)); } catch { /* Identity is already persisted on the server. */ }
      router.replace("/play"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen."); setBusy(false); }
  }
  return <main className="creator3d fixed-founder-creator"><section><div className="creator-brand"><BrandLogo variant="compact"/></div><div className="creator-controls"><p className="panel-label">FOUNDER STUDIO</p><h1>Dein Founder</h1></div><FounderEditor modelId={modelId} name={name} onChange={setModelId} onName={setName}/></section><section className="creator-stage">{modelId ? <Character3D modelId={modelId} resetKey={reset}/> : <div className="founder-no-selection">Charakter auswählen</div>}<FounderEditorTools onResetView={() => setReset(value => value + 1)}/></section><aside className="skill-select"><p className="panel-label">PERMANENTE AUSRICHTUNG</p><h2>Founder Skill</h2>{Object.entries(FOUNDER_SKILLS).map(([id, item]) => <button key={id} aria-pressed={skill === id} className={skill === id ? "active" : ""} onClick={() => setSkill(id as FounderSkill)}><RepairEmpireIcon category="skills" name={id.toLowerCase()} size="lg"/><strong>{item.name}</strong><span>{item.bonus}</span><p>{item.description}</p></button>)}<div className="founder-review"><strong>{name.trim() || "CEO Name"}</strong><span>{modelId ? CHARACTER_MODELS[modelId].label : "Kein Charakter gewählt"}</span><span>{skill ? FOUNDER_SKILLS[skill].name : "Kein Skill gewählt"}</span>{skill && <small>{FOUNDER_SKILLS[skill].bonus}</small>}</div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="create3d" disabled={!modelId || !skill || name.trim().length < 2 || busy} onClick={finish}>{busy ? "Speichert…" : "Charakter erstellen"}</button></aside></main>;
}
