"use client";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { ActiveIcon as Check } from "@/components/repair-icons";
import { CharacterRenderer } from "@/components/character-renderer";
import { APPEARANCE_OPTIONS, DEFAULT_APPEARANCE } from "@/game/data/cosmetics";
import { normalizeCharacterName, validateCharacterName } from "@/game/logic/cosmetics";
import type { CharacterAppearance } from "@/game/types";

const LABELS: Record<string, string> = { COMPACT: "Kompakt", BALANCED: "Ausgewogen", TALL: "Groß", LIGHT: "Hell", WARM: "Warm", MEDIUM: "Mittel", DEEP: "Dunkel", FOCUSED: "Fokussiert", CALM: "Ruhig", BOLD: "Markant", SHORT: "Kurz", CROP: "Crop", WAVES: "Wellen", TIED: "Gebunden", BLACK: "Schwarz", BROWN: "Braun", COPPER: "Kupfer", BLONDE: "Blond", SILVER: "Silber" };
const OUTFITS = ["outfit-basic-workwear", "outfit-dark-technician"];

export function CharacterCreator({ onCreate }: { onCreate: (name: string, appearance: CharacterAppearance, outfitId: string) => void }) {
  const [name, setName] = useState(""); const [appearance, setAppearance] = useState<CharacterAppearance>(DEFAULT_APPEARANCE); const [outfit, setOutfit] = useState(OUTFITS[0]);
  const error = name ? validateCharacterName(name) : null;
  const renderOptions = <K extends keyof CharacterAppearance>(key: K, title: string, values: readonly CharacterAppearance[K][]) => <fieldset><legend>{title}</legend><div className={`creator-options option-${key}`}>{values.map((value) => <button type="button" className={appearance[key] === value ? "selected" : ""} onClick={() => setAppearance((current) => ({ ...current, [key]: value }))} key={value}>{key === "skinTone" || key === "hairColor" ? <i className={`swatch swatch-${String(value).toLowerCase()}`} /> : null}{LABELS[String(value)]}{appearance[key] === value && <Check size={12} />}</button>)}</div></fieldset>;
  return <div className="character-setup-backdrop"><section className="character-creator" role="dialog" aria-modal="true"><div className="creator-copy"><p className="panel-label">FOUNDER IDENTITY // INITIAL SETUP</p><h2>Wer baut dieses Empire?</h2><p>Dein Founder ist deine visuelle Identität. Unternehmenswerte bleiben davon vollständig getrennt.</p><label>Founder Name<input value={name} minLength={2} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder="Name eingeben" /></label>{error && <small>{error}</small>}{renderOptions("bodyPreset", "Präsentation", APPEARANCE_OPTIONS.bodyPreset)}{renderOptions("skinTone", "Hautton", APPEARANCE_OPTIONS.skinTone)}{renderOptions("facePreset", "Gesicht", APPEARANCE_OPTIONS.facePreset)}{renderOptions("hairStyle", "Frisur", APPEARANCE_OPTIONS.hairStyle)}{renderOptions("hairColor", "Haarfarbe", APPEARANCE_OPTIONS.hairColor)}<fieldset><legend>Start-Outfit</legend><div className="creator-options">{OUTFITS.map((id) => <button type="button" className={outfit === id ? "selected" : ""} onClick={() => setOutfit(id)} key={id}>{id === OUTFITS[0] ? "Basic Workwear" : "Dark Technician"}</button>)}</div></fieldset><button className="create-founder" disabled={Boolean(validateCharacterName(name))} onClick={() => onCreate(normalizeCharacterName(name), appearance, outfit)}><UserRound size={17} /> Founder erstellen</button></div><div className="creator-preview"><span>LIVE PREVIEW</span><CharacterRenderer appearance={appearance} cosmetics={{ OUTFIT: outfit, HEADWEAR: null, ACCESSORY: null }} /><strong>{normalizeCharacterName(name) || "Founder"}</strong><small>CEO · {LABELS[appearance.bodyPreset]}</small></div></section></div>;
}
