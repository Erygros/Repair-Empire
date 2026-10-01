export type AudioCategory = "UI" | "WORKSHOP" | "REPAIR" | "REWARD" | "AMBIENCE";
export type PrototypeSound = "click" | "repair-start" | "repair-complete" | "level-up" | "building-upgrade";

const SOUND_SHAPES: Record<PrototypeSound, { frequency: number; duration: number; category: AudioCategory }> = {
  click: { frequency: 520, duration: .035, category: "UI" },
  "repair-start": { frequency: 280, duration: .08, category: "REPAIR" },
  "repair-complete": { frequency: 760, duration: .16, category: "REWARD" },
  "level-up": { frequency: 920, duration: .24, category: "REWARD" },
  "building-upgrade": { frequency: 420, duration: .2, category: "WORKSHOP" },
};

export interface AudioSettings { master: number; sfx: number; ambience: number; muted: boolean; motion: "AUTO" | "FULL" | "REDUCED"; }
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = { master: .7, sfx: .65, ambience: .25, muted: false, motion: "AUTO" };
export const AUDIO_SETTINGS_KEY = "repair-empire-audio-v1";
let sharedContext: AudioContext | null = null;

export function playPrototypeSound(sound: PrototypeSound, settings: AudioSettings) {
  if (settings.muted || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  try {
    const context = sharedContext ?? new AudioContextClass();
    sharedContext = context;
    if (context.state === "suspended") void context.resume();
    const shape = SOUND_SHAPES[sound];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = shape.frequency;
    gain.gain.setValueAtTime(Math.max(.0001, settings.master * settings.sfx * .08), context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + shape.duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + shape.duration);
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Prototype audio unavailable", error);
  }
}
