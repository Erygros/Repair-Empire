"use client";

import { useEffect, useState } from "react";
import { DeleteIcon } from "@/components/repair-icons";
import { Volume2, VolumeX, X } from "lucide-react";
import { SettingsIcon as Settings } from "@/components/repair-icons";
import { AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS, type AudioSettings } from "@/game/audio/prototype-audio";

export function usePrototypeSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;
    try { const saved = localStorage.getItem(AUDIO_SETTINGS_KEY); return saved ? { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AUDIO_SETTINGS; } catch (error) { if (process.env.NODE_ENV === "development") console.warn("Audio settings could not be loaded", error); return DEFAULT_AUDIO_SETTINGS; }
  });
  useEffect(() => {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.dataset.motion = settings.motion.toLowerCase();
  }, [settings]);
  return { settings, setSettings };
}
export function PrototypeSettings({ settings, onChange, onReset }: { settings: AudioSettings; onChange: (settings: AudioSettings) => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  return <><button className="settings-trigger" onClick={() => setOpen(true)} title="Einstellungen" aria-label="Einstellungen öffnen"><Settings size={18} /></button>{open && <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="prototype-settings" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><div><p className="panel-label">PROTOTYPE CONTROL</p><h3 id="settings-title">Einstellungen</h3></div><button onClick={() => setOpen(false)} aria-label="Schließen"><X size={18} /></button></header>
    <label>Master Volume <span>{Math.round(settings.master * 100)}%</span><input type="range" min="0" max="1" step=".05" value={settings.master} onChange={(event) => onChange({ ...settings, master: Number(event.target.value) })} /></label>
    <label>Sound Effects <span>{Math.round(settings.sfx * 100)}%</span><input type="range" min="0" max="1" step=".05" value={settings.sfx} onChange={(event) => onChange({ ...settings, sfx: Number(event.target.value) })} /></label>
    <label>Ambience <span>{Math.round(settings.ambience * 100)}%</span><input type="range" min="0" max="1" step=".05" value={settings.ambience} onChange={(event) => onChange({ ...settings, ambience: Number(event.target.value) })} /></label>
    <button className={`mute-toggle ${settings.muted ? "active" : ""}`} onClick={() => onChange({ ...settings, muted: !settings.muted })}>{settings.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{settings.muted ? "Audio stumm" : "Audio aktiv"}</button>
    <fieldset><legend>Bewegung</legend>{(["AUTO", "FULL", "REDUCED"] as const).map((motion) => <button className={settings.motion === motion ? "active" : ""} key={motion} onClick={() => onChange({ ...settings, motion })}>{motion}</button>)}</fieldset>
    <button className="reset-save-button" onClick={onReset}><DeleteIcon size="sm"/> Spielstand zurücksetzen</button>
  </section></div>}</>;
}
